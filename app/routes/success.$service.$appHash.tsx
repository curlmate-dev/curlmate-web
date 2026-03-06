import { LoaderFunctionArgs } from "@remix-run/node";
import { isApiHost } from "~/utils/get-host";

export async function loader({ request }: LoaderFunctionArgs) {
  if (isApiHost(request)) {
    throw new Response("Not found", { status: 404 });
  }

  return null;
}

export default function SuccessPage() {
  return (
    <div className="min-h-screen bg-[#f5f5dc] flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-green-600 mb-4">
          Authorization Successful
        </h1>
        <p className="text-gray-600">You can close this window.</p>
      </div>
    </div>
  );
}
