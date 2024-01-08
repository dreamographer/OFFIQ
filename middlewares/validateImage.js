//multer
const multer = require('multer')
const path = require('path');
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, '/uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage, fileFilter: (req, file, cb) => {
    // Custom file type validation function
    const allowedMimes = ['image/jpeg', 'image/png', 'image/gif'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, and JPG files are allowed.'));
    }
  }
});

let uploadArray = upload.array('productImage');

module.exports = function validateImage(fieldName) {
  const uploadArray = upload.array(fieldName);
  return function (req, res, next) {
    uploadArray(req, res, (err) => {
      if (err) {
        // Handle error
        req.session.err = 'Invalid file type. Only JPEG, PNG, and JPG files are allowed';
        return res.status(500).redirect('back');
      } else {
        next();
      }
    });
  };
};
