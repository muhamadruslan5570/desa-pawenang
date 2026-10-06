export default async () => {
  return new Response(
    JSON.stringify({
      success: true,
      message: "Pawenang Backend Netlify aktif"
    }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json"
      }
    }
  );
};
