function valid(body) {
  try {
    return true;
  } catch (err: unknown) {
    //log
    return false;
  }
}

export async function sendGmail(params:type) {
  const { body } = params;

  const validBody = valid(body);
  if (!validBody) {
    //log
    return Response.json({}, {});
  }

  const response = await fetch();

  if (!response.ok) {
    //log
    return Response.json({}, {});
  }
  return await response.json();
}
