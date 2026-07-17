import multer from "multer";
import fs from "fs";

export const multerUploadLocal = (custemPrameter,custemExtation=[]) => {
    const fullPath= `uploads/${custemPrameter}`
    if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
    }
  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, fullPath); // هنا بيتخزن في فولدر uploads
    },
    filename: function (req, file, cb) {
      // console.log(file); // هتلاقي هنا mimetype, originalname, إلخ
  const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
      cb(null, uniqueSuffix + '-' +file.originalname ); // الاسم اللي هيتخزن بيه
    },
  });

function fileFilter(req , file, cb) {
    if (!custemExtation.includes(file.mimetype)) {
        cb(new Error('File type is not allowed'), false)
    }else{
        cb(null, true)
    }
} 
  const upload = multer({ storage,fileFilter });
  return upload;
};


export const multerUploadhost = ({custemExtation=[], maxSize = 10 * 1024 * 1024}) => {
 
  const storage = multer.diskStorage({});

function fileFilter(req , file, cb) {

    if (!custemExtation.includes(file.mimetype)) {
        cb(new Error('File type is not allowed'), false)

    }else{
        cb(null, true)
    }

} 
  const upload = multer({ storage, fileFilter, limits: { fileSize: maxSize } });
  return upload;
};
  