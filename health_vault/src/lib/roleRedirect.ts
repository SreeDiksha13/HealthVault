import { redirect } from "next/navigation";

export function redirectUser(role: string) {
  if (role === "patient") {
    redirect("/patient-dashboard");
  } else if (role === "doctor") {
    redirect("/doctor-dashboard");
  } else {
    redirect("/login");
  }
}
