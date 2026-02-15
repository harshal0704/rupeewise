const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'demo';
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'unsigned_preset';

export const cloudinaryService = {
    uploadImage: async (file: File): Promise<string | null> => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', UPLOAD_PRESET);

        try {
            const response = await fetch(
                `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
                {
                    method: 'POST',
                    body: formData,
                }
            );
            const data = await response.json();
            return data.secure_url || null;
        } catch (error) {
            console.error("Cloudinary Upload Error:", error);
            return null;
        }
    }
};
