import { v2 as cloudinary } from "cloudinary";
import {fs} from "fs";

cloudinary.config({ 
        cloud_name:process.env.CLOUDINARY_CLOUD_NAME, 
        api_key:process.env.CLOUDINARY_API_KEY, 
        api_secret:process.env.CLOUDINARY_API_SECRET // Click 'View API Keys' above to copy your API secret
    });

const uploadOnCloudiary=async(localFilePath)=>{
    try {
        if(!localFilePath) throw new Error("Couldnot find a path");
        // uploading process
        const response=await cloudinary.uploader.upload(localFilePath,{
            resource_type:"auto"
        })
        //file has been uploaded
        console.log("File on cloudianry",response.url);
        return response;
    } catch (error) {
        fs.unlinkSync(localFilePath)  //remove file locally as upload failed
        return null;
    }
}

export {uploadOnCloudiary}