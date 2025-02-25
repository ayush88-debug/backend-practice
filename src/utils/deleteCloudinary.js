import { v2 as cloudinary } from 'cloudinary';

    // Configuration
    cloudinary.config({ 
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
        api_key: process.env.CLOUDINARY_API_KEY, 
        api_secret: process.env.CLOUDINARY_API_SECRET
    });


const deleteFromCloudinary=async(publicId)=>{
    try {
        if(!publicId){
            return null
        }
        const response = await cloudinary.uploader
        .destroy(publicId)
        return response.result
    } catch (error) {
        console.error("File upload Failed : ",error)
        return null
    }
}

export {deleteFromCloudinary}