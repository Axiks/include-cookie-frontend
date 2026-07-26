import { getApiDocs } from "@/lib/swagger";
import ReactSwagger from "./react-swagger";

export default async function IndexPage() {
  const inDevEnvironment = !!process && process.env.NODE_ENV === 'development';
  if(!inDevEnvironment) return
  
  const spec = await getApiDocs();
  return (
    <section className="container">
      <ReactSwagger spec={spec} />
    </section>
  );
}