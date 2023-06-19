const  { Configuration, OpenAIApi } = require('openai');
require('dotenv').config();

const Configuration = new Configuration({
    apiKey: process.env.OPEN_API_KEY
})