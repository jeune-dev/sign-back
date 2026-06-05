const cloudinary = require('../config/cloudinary');
const fs = require('fs');

const uploadImage = async (filePath) => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: "profil_users",
      use_filename: true,
      unique_filename: false,
      overwrite: true
    });
    return result.secure_url;
  } catch (error) {
    console.error("Erreur upload image:", error);
    throw error;
  } finally {
    fs.unlink(filePath, (err) => {
      if (err) console.error("Erreur suppression fichier local:", err.message);
    });
  }
};

module.exports = { uploadImage };
