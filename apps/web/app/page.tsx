import Menu from "@/ui/menu";
import Editor from "@/ui/editor";

export default function Page() {
  return (
    <div className="flex min-h-screen flex-col items-center sm:px-5 sm:pt-[calc(20vh)]">
      <div
        className="absolute bottom-5 left-5 z-10 max-h-fit rounded-lg p-4 transition-colors duration-200 sm:bottom-auto sm:top-5 text-xl text-lime-800"
      >
        📄 AgentDocs
      </div>
      <Menu />
      <Editor />
    </div>
  );
}
