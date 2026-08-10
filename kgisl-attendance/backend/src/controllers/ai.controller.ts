import { Request, Response } from 'express';
import axios from 'axios';
import fs from 'fs';
import FormData from 'form-data';

export const verifyHeadcount = async (req: Request, res: Response): Promise<void> => {
    try {
        const { sessionId } = req.params;

        // Check if an image was uploaded
        if (!req.file) {
            res.status(400).json({ error: 'No image uploaded' });
            return;
        }

        // Send the image to the Python AI Engine
        const formData = new FormData();
        formData.append('file', fs.createReadStream(req.file.path));

        const aiEngineUrl = process.env.AI_ENGINE_URL || 'http://localhost:8000';
        
        try {
            const aiResponse = await axios.post(`${aiEngineUrl}/analyze-image`, formData, {
                headers: {
                    ...formData.getHeaders(),
                },
            });

            // Delete the temp file after sending
            fs.unlink(req.file.path, (err) => {
                if (err) console.error("Error deleting temp file:", err);
            });

            // Assuming we fetch active scans from DB/Redis here for comparison
            // For now, we just return the AI headcount and the annotated image
            const { headcount, annotated_image } = aiResponse.data;

            res.status(200).json({
                success: true,
                message: "Headcount verified successfully",
                aiHeadcount: headcount,
                annotatedImage: annotated_image,
                sessionId: sessionId
            });
            return;
        } catch (aiError) {
            fs.unlink(req.file.path, () => {});
            console.error("AI Engine Error:", aiError);
            res.status(500).json({ error: 'Failed to process image with AI engine' });
            return;
        }

    } catch (error) {
        console.error('Error in verifyHeadcount:', error);
        res.status(500).json({ error: 'Internal Server Error' });
        return;
    }
};
