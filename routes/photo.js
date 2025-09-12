const express = require("express");
const router = express.Router();
const uniqid = require("uniqid"); // génère un nom de fichier unique
//il lit automatiquement l'url dans .env
const cloudinary = require("cloudinary").v2;
const fs = require("fs");

// POST pour uploader une photo sur le server Cloudinary
// /photo/upload

router.post("/upload", async (req, res) => {
  {/*creation d'un fichier temporaire*/}
  
  // on génère un nom unique 
  const uniqueFileName = `${uniqid()}.jpg`;
  // on sauvegarde temporairement l’image dans le dossier ./tmp/
  const photoPath = `./tmp/${uniqueFileName}`;
 // mv() déplace le fichier uploadé vers ce chemin
  const resultMove = await req.files.photoFromFront.mv(photoPath);
  // envoie le fichier temporaire à Cloudinary
  // Cloudinary retourne des infos sur l’image dont secure_url (l’URL publique pour accéder à l’image)
  const resultCloudinary = await cloudinary.uploader.upload(photoPath);
  //suppression du fichier temporaire
  fs.unlinkSync(photoPath);
  // reponse au front 
  res.json({ result: true, url: resultCloudinary.secure_url });
});

module.exports = router;
