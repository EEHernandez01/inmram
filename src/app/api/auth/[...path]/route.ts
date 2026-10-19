function migrated() {
  return new Response("La autenticación ahora usa Supabase.", { status: 410 });
}

export const GET = migrated;
export const POST = migrated;
