import { Suspense } from "react";
import HomeContent from "@/components/HomeContent";

export default function Home() {
  return (
    //عشان ال use params
    <Suspense fallback={null}>
      <HomeContent />
    </Suspense>
  );
}
