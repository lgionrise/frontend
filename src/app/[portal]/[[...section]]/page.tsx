import { Portal } from "@/components/portal";
import { notFound } from "next/navigation";

type PageProps = {
  params: Promise<{ portal: string; section?: string[] }>;
};

export default async function PortalPage({ params }: PageProps) {
  const { portal, section = [] } = await params;
  if (portal !== "student" && portal !== "teacher") notFound();
  return <Portal role={portal} section={section} />;
}
