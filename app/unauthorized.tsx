import { ErrorLayout } from "@/components/errors/error-layout";

export default function Unauthorized() { return <ErrorLayout kind="unauthorized" autoLogin />; }
