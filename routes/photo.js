var express = require('express');
var router = express.Router();
const uniqid = require("uniqid");
//il lit automatiquement l'url dans .env
const cloudinary = require("cloudinary").v2;
const fs = require('fs');
    
router.post("/upload", async (req, res) => {
     console.log("req.files:", req.files);
  console.log("req.body:", req.body);
    const uniqueFileName = `${uniqid()}.jpg`
    const photoPath = `./tmp/${uniqueFileName}`;
    // sauvegarde temporaire du fichier sur le server backend
    const resultMove = await req.files.photoFromFront.mv(photoPath);
    // upload vers Cloudinary
    const resultCloudinary = await cloudinary.uploader.upload(photoPath);
    //suppression du fichier temporaire
    fs.unlinkSync(photoPath)
    // reponse
    res.json({ result: true, url: resultCloudinary.secure_url }); 

});


module.exports = router; 