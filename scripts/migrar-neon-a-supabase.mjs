import postgres from "postgres";
import { createClient } from "@supabase/supabase-js";

const sourceUrl = process.env.NEON_DATABASE_URL;
const targetUrl = process.env.DATABASE_URL;
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;

if (!sourceUrl || !targetUrl || !supabaseUrl || !supabaseSecretKey) {
  throw new Error("Faltan variables de conexión para migrar Neon a Supabase.");
}

if (!new URL(sourceUrl).hostname.endsWith("neon.tech")) {
  throw new Error("NEON_DATABASE_URL no apunta a Neon.");
}

if (!new URL(targetUrl).hostname.endsWith("pooler.supabase.com")) {
  throw new Error("DATABASE_URL no apunta al pooler de Supabase.");
}

if (targetUrl.includes("[YOUR-PASSWORD]")) {
  throw new Error("DATABASE_URL todavía contiene el marcador de contraseña.");
}

const source = postgres(sourceUrl, {
  max: 1,
  connect_timeout: 10,
  idle_timeout: 2,
  ssl: "require",
});
const target = postgres(targetUrl, {
  max: 1,
  connect_timeout: 10,
  idle_timeout: 2,
  ssl: "require",
});
const supabase = createClient(supabaseUrl, supabaseSecretKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const quote = (identifier) => `"${identifier.replaceAll('"', '""')}"`;
const publicTableQuery = (connection) => connection`
  SELECT table_name
  FROM information_schema.tables
  WHERE table_schema = 'public'
    AND table_type = 'BASE TABLE'
    AND table_name <> '_prisma_migrations'
  ORDER BY table_name
`;

function orderByForeignKeys(tableNames, foreignKeys) {
  const children = new Map(tableNames.map((table) => [table, new Set()]));
  const incoming = new Map(tableNames.map((table) => [table, 0]));

  for (const { child, parent } of foreignKeys) {
    if (child === parent || !children.has(child) || !children.has(parent)) continue;
    if (children.get(parent).has(child)) continue;
    children.get(parent).add(child);
    incoming.set(child, incoming.get(child) + 1);
  }

  const ready = tableNames.filter((table) => incoming.get(table) === 0);
  const ordered = [];

  while (ready.length > 0) {
    const parent = ready.shift();
    ordered.push(parent);
    for (const child of children.get(parent)) {
      incoming.set(child, incoming.get(child) - 1);
      if (incoming.get(child) === 0) ready.push(child);
    }
  }

  if (ordered.length !== tableNames.length) {
    throw new Error("Hay dependencias circulares entre tablas públicas.");
  }

  return ordered;
}

try {
  const sourceSnapshot = await source.begin(async (tx) => {
    await tx`SET TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY`;

    const tables = (await publicTableQuery(tx)).map((row) => row.table_name);
    const columns = await tx`
      SELECT table_name, column_name, udt_name, ordinal_position
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name <> '_prisma_migrations'
      ORDER BY table_name, ordinal_position
    `;
    const foreignKeys = await tx`
      SELECT tc.table_name AS child, ccu.table_name AS parent
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_catalog = kcu.constraint_catalog
        AND tc.constraint_schema = kcu.constraint_schema
        AND tc.constraint_name = kcu.constraint_name
        AND tc.table_name = kcu.table_name
      JOIN information_schema.constraint_column_usage ccu
        ON tc.constraint_catalog = ccu.constraint_catalog
        AND tc.constraint_schema = ccu.constraint_schema
        AND tc.constraint_name = ccu.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema = 'public'
        AND ccu.table_schema = 'public'
    `;
    const rows = new Map();

    for (const table of tables) {
      const tableColumns = columns
        .filter((column) => column.table_name === table)
        .map((column) => column.column_name);
      const selectedColumns = tableColumns
        .map((column) => `${quote(column)}::text AS ${quote(column)}`)
        .join(", ");
      rows.set(
        table,
        await tx.unsafe(
          `SELECT ${selectedColumns} FROM public.${quote(table)}`,
        ),
      );
    }

    const authUsers = await tx`
      SELECT id::text AS id, email, name, "emailVerified"
      FROM neon_auth."user"
      ORDER BY id
    `;
    const appUsers = await tx`
      SELECT "neonAuthUserId"
      FROM public."UsuarioSistema"
      ORDER BY "neonAuthUserId"
    `;

    return { tables, columns, foreignKeys, rows, authUsers, appUsers };
  });

  const [targetTablesResult, targetColumns] = await Promise.all([
    publicTableQuery(target),
    target`
      SELECT table_name, column_name, udt_name, ordinal_position
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name <> '_prisma_migrations'
      ORDER BY table_name, ordinal_position
    `,
  ]);
  const targetTables = targetTablesResult.map((row) => row.table_name);

  if (JSON.stringify(sourceSnapshot.tables) !== JSON.stringify(targetTables)) {
    throw new Error("Las tablas públicas de Neon y Supabase no coinciden.");
  }

  const normalizeColumns = (columns) =>
    columns.map(({ table_name, column_name, udt_name }) =>
      `${table_name}.${column_name}:${udt_name}`,
    );
  if (
    JSON.stringify(normalizeColumns(sourceSnapshot.columns)) !==
    JSON.stringify(normalizeColumns(targetColumns))
  ) {
    throw new Error("Las columnas de Neon y Supabase no coinciden.");
  }

  const sourceCounts = Object.fromEntries(
    sourceSnapshot.tables.map((table) => [table, sourceSnapshot.rows.get(table).length]),
  );
  const targetCounts = {};
  for (const table of targetTables) {
    const rows = await target.unsafe(
      `SELECT count(*)::int AS count FROM public.${quote(table)}`,
    );
    targetCounts[table] = rows[0].count;
  }

  const targetEmpty = Object.values(targetCounts).every((count) => count === 0);
  const targetComplete = Object.keys(sourceCounts).every(
    (table) => sourceCounts[table] === targetCounts[table],
  );
  if (!targetEmpty && !targetComplete) {
    throw new Error("Supabase contiene datos parciales; se cancela para evitar duplicados.");
  }

  const sourceEmails = new Set();
  const sourceUserIds = new Set();
  for (const user of sourceSnapshot.authUsers) {
    if (!user.email || sourceEmails.has(user.email.toLowerCase())) {
      throw new Error("Neon contiene un correo vacío o duplicado en Auth.");
    }
    sourceEmails.add(user.email.toLowerCase());
    sourceUserIds.add(user.id);
  }

  const { data: listedUsers, error: listError } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });
  if (listError) throw new Error("No se pudo consultar Supabase Auth.");

  const targetUsersByEmail = new Map(
    listedUsers.users
      .filter((user) => user.email)
      .map((user) => [user.email.toLowerCase(), user]),
  );
  if ([...targetUsersByEmail.keys()].some((email) => !sourceEmails.has(email))) {
    throw new Error("Supabase Auth ya tiene usuarios ajenos a la importación.");
  }

  const userIds = new Map();
  for (const user of sourceSnapshot.authUsers) {
    let targetUser = targetUsersByEmail.get(user.email.toLowerCase());
    if (!targetUser) {
      const { data, error } = await supabase.auth.admin.createUser({
        email: user.email,
        email_confirm: user.emailVerified === true,
        user_metadata: { name: user.name ?? "" },
      });
      if (error || !data.user) {
        throw new Error("No se pudo importar una cuenta a Supabase Auth.");
      }
      targetUser = data.user;
      targetUsersByEmail.set(user.email.toLowerCase(), targetUser);
    }
    userIds.set(user.id, targetUser.id);
  }

  const validAuthIds = new Set([...sourceUserIds, ...userIds.values()]);
  if (
    sourceSnapshot.appUsers.length !== sourceUserIds.size ||
    sourceSnapshot.appUsers.some((user) => !validAuthIds.has(user.neonAuthUserId))
  ) {
    throw new Error("Hay usuarios de la aplicación que no tienen una cuenta de Auth vinculada.");
  }

  if (targetEmpty) {
    const orderedTables = orderByForeignKeys(
      sourceSnapshot.tables,
      sourceSnapshot.foreignKeys,
    );

    await target.begin(async (tx) => {
      for (const table of orderedTables) {
        const rows = sourceSnapshot.rows.get(table);
        if (rows.length === 0) continue;
        const columns = sourceSnapshot.columns
          .filter((column) => column.table_name === table)
          .map((column) => column.column_name);
        const names = columns.map(quote).join(", ");
        const placeholders = columns.map((_, index) => `$${index + 1}`).join(", ");
        const insert = `INSERT INTO public.${quote(table)} (${names}) VALUES (${placeholders})`;

        for (const row of rows) {
          await tx.unsafe(insert, columns.map((column) => row[column]));
        }
      }
    });
  }

  await target.begin(async (tx) => {
    for (const [neonId, supabaseId] of userIds) {
      const matchingRows = await tx`
        SELECT id, "neonAuthUserId"
        FROM public."UsuarioSistema"
        WHERE "neonAuthUserId" = ${neonId}
           OR "neonAuthUserId" = ${supabaseId}
      `;
      if (matchingRows.length !== 1) {
        throw new Error("No se pudo validar el vínculo de un usuario importado.");
      }
      if (matchingRows[0].neonAuthUserId === neonId) {
        await tx`
          UPDATE public."UsuarioSistema"
          SET "neonAuthUserId" = ${supabaseId}
          WHERE id = ${matchingRows[0].id}
        `;
      }
    }

    for (const table of targetTables) {
      const result = await tx.unsafe(
        `SELECT count(*)::int AS count FROM public.${quote(table)}`,
      );
      if (result[0].count !== sourceCounts[table]) {
        throw new Error(`El conteo de ${table} no coincide tras la importación.`);
      }
    }
  });

  process.stdout.write(
    JSON.stringify({
      tablas: sourceSnapshot.tables.length,
      filas: Object.values(sourceCounts).reduce((sum, count) => sum + count, 0),
      usuariosAuth: userIds.size,
      destino: "Supabase",
    }),
  );
} finally {
  await Promise.all([
    source.end({ timeout: 2 }),
    target.end({ timeout: 2 }),
  ]);
}
