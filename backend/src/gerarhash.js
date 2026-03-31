import bcrypt from "bcryptjs";

const senha = "957842Li";

bcrypt.hash(senha, 10).then((hash) => {
  console.log(hash);
});