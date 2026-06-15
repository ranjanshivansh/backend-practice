import { v2 as cloudinary } from "cloudinary";
import fs from "fs";


    
const uploadOnCloudiary=async(localFilePath)=>{
    try {
        console.log("helllo")
        if(!localFilePath) throw new Error("Couldnot find a path");
        cloudinary.config({ 
        cloud_name:process.env.CLOUDINARY_CLOUD_NAME, 
        api_key:process.env.CLOUDINARY_API_KEY, 
        api_secret:process.env.CLOUDINARY_API_SECRET // Click 'View API Keys' above to copy your API secret
    });
        // uploading process
        const response=await cloudinary.uploader.upload(localFilePath,{
            resource_type:"auto"
        })
        //file has been uploaded
        // console.log("File on cloudianry",response.url);
        fs.unlinkSync(localFilePath)
        return response;
    } catch (error) {
    console.error("Cloudinary Error:", error);

    if(localFilePath && fs.existsSync(localFilePath)){
        fs.unlinkSync(localFilePath);
    }

    return null;
}
}

export {uploadOnCloudiary}