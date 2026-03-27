export default function RotaProtegida({ children }) {
  const token = localStorage.getItem("adminTokenAdditiveHub");

  if (!token) {
    window.location.href = "/#/login";
    return null;
  }

  return children;
}