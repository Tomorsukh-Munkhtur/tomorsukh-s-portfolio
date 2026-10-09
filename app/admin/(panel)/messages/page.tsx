import { MessageInbox } from "@/components/admin/message-inbox";
import { PageHeader } from "@/components/admin/ui";
import { getMessages } from "@/lib/admin-data";
import { requireAdmin } from "@/lib/auth";

export const metadata = { title: "Мессеж" };

export default async function MessagesPage({ searchParams }: PageProps<"/admin/messages">) {
  const ctx = await requireAdmin();
  const [messages, { open }] = await Promise.all([getMessages(ctx), searchParams]);

  return (
    <>
      <PageHeader title="Мессеж" description="Сайтын холбоо барих формоор ирсэн захидлууд." />
      <MessageInbox messages={messages} openId={typeof open === "string" ? open : undefined} />
    </>
  );
}
