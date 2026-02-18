export async function loader() {
  return new Response(`User-agent: * Allow: /`, {
    headers: {
      "Content-type": "text/plain",
    },
  });
}
