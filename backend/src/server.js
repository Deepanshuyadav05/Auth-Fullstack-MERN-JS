import 'dotenv/config';
import app from './app.js';

const startServer = async () => {
    const PORT = process.env.PORT || 5000;
    //connect to DB

    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}

startServer().catch((err) => {
    console.error('Error starting server:', err);
    process.exit(1);
});       