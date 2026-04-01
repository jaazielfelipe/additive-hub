import bcrypt from "bcryptjs";

const senha = "Pt3chzp4"; // troque pela senha que quiser

const hash = await bcrypt.hash(senha, 10);

console.log("Senha:", senha);
console.log("Hash:", hash);