const express = require('express');
const axios = require('axios');
const router = express.Router();
require('dotenv').config();

const API_ENDPOINT=process.env.OPENPECHA_ENDPOINT;

/**
 * @swagger
 * /text:
 *   get:
 *     summary: Get texts from OpenPecha API
 *     description: Retrieves a list of texts with optional filtering by language and author
 *     tags: [Texts]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 30
 *         description: Maximum number of texts to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Number of texts to skip
 *       - in: query
 *         name: language
 *         schema:
 *           type: string
 *         description: Filter texts by language code (e.g., 'bo' for Tibetan)
 *       - in: query
 *         name: author
 *         schema:
 *           type: string
 *         description: Filter texts by author ID
 *     responses:
 *       200:
 *         description: Successfully retrieved texts
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 results:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Text'
 *                 count:
 *                   type: integer
 *                   description: Total number of texts
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/', async (req, res) => {
  try {
    const { limit = 30, offset = 0, language, author } = req.query;
    
    // Build query parameters for OpenPecha API
    const queryParams = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString()
    });
    
    if (language) queryParams.append('language', language);
    if (author) queryParams.append('author', author);
    
    const apiUrl = `${API_ENDPOINT}/texts?${queryParams.toString()}`;
    const response = await axios.get(apiUrl, {
      headers: {
        'accept': 'application/json'
      }
    });
    
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching texts:', error.message);
    res.status(500).json({ 
      error: 'Failed to fetch texts from OpenPecha API',
      details: error.message 
    });
  }
});

/**
 * @swagger
 * /text:
 *   post:
 *     summary: Create a new text
 *     description: Creates a new text record in the OpenPecha API
 *     tags: [Texts]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *               - title
 *               - language
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [root, translation, commentary]
 *                 description: Type of text
 *               title:
 *                 type: object
 *                 description: Title in multiple languages
 *                 properties:
 *                   en:
 *                     type: string
 *                     description: English title
 *                   bo:
 *                     type: string
 *                     description: Tibetan title
 *               language:
 *                 type: string
 *                 description: Primary language code
 *                 example: bo
 *               contributions:
 *                 type: array
 *                 description: List of contributors
 *                 items:
 *                   type: object
 *                   properties:
 *                     person_id:
 *                       type: string
 *                       description: Person ID
 *                     role:
 *                       type: string
 *                       enum: [author, translator, reviser, editor]
 *                       description: Role of the contributor
 *               date:
 *                 type: string
 *                 format: date
 *                 description: Date of creation
 *                 example: "2024-01-01"
 *               bdrc:
 *                 type: string
 *                 description: BDRC identifier
 *               alt_titles:
 *                 type: array
 *                 description: Alternative titles
 *                 items:
 *                   type: object
 *                   properties:
 *                     en:
 *                       type: string
 *                     bo:
 *                       type: string
 *           examples:
 *             root_text:
 *               summary: Root text creation
 *               value:
 *                 type: "root"
 *                 title:
 *                   en: "Sample Root Text"
 *                   bo: "བོད་ཡིག་དཔེ་མཚོན།"
 *                 language: "bo"
 *                 contributions:
 *                   - person_id: "P12345678"
 *                     role: "author"
 *                 date: "2024-01-01"
 *                 bdrc: "W123456"
 *     responses:
 *       201:
 *         description: Text created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Text'
 *       400:
 *         description: Bad request - invalid input data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/', async (req, res) => {
  try {
    const textData = req.body;
    
    // Validate required fields
    if (!textData.type || !textData.title || !textData.language) {
      return res.status(400).json({
        error: 'Missing required fields',
        details: 'type, title, and language are required'
      });
    }

    // Validate text type
    const validTypes = ['root', 'translation', 'commentary'];
    if (!validTypes.includes(textData.type)) {
      return res.status(400).json({
        error: 'Invalid text type',
        details: `type must be one of: ${validTypes.join(', ')}`
      });
    }

    // Validate contributions if provided
    if (textData.contributions) {
      const validRoles = ['author', 'translator', 'reviser', 'editor'];
      for (const contribution of textData.contributions) {
        if (!contribution.person_id || !contribution.role) {
          return res.status(400).json({
            error: 'Invalid contribution',
            details: 'Each contribution must have person_id and role'
          });
        }
        if (!validRoles.includes(contribution.role)) {
          return res.status(400).json({
            error: 'Invalid contribution role',
            details: `role must be one of: ${validRoles.join(', ')}`
          });
        }
      }
    }

    const apiUrl = `${API_ENDPOINT}/texts`;

    const response = await axios.post(apiUrl, textData, {
      headers: {
        'accept': 'application/json',
        'content-type': 'application/json'
      }
    });

    res.status(201).json(response.data);
  } catch (error) {
    console.error('Error creating text:', error.message);
    if (error.response) {
      // Forward the error response from OpenPecha API
      res.status(error.response.status).json({
        error: 'Failed to create text in OpenPecha API',
        details: error.response.data || error.message
      });
    } else {
      res.status(500).json({
        error: 'Failed to create text',
        details: error.message
      });
    }
  }
});


router.get("/:id", async (req, res) => {
  const { id } = req.params;
  const apiUrl = `${API_ENDPOINT}/texts/${id}`;
  const response = await axios.get(apiUrl, {
    headers: {
      'accept': 'application/json'
    }
  });
  res.json(response.data);
});

router.get("/:id/instances", async (req, res) => {
  const { id } = req.params;
  const apiUrl = `${API_ENDPOINT}/texts/${id}/instances`;

  const response = await axios.get(apiUrl, {
    headers: {
      'accept': 'application/json'
    }
  });
  res.json(response.data);
});

/**
 * @swagger
 * /text/{id}/instances:
 *   post:
 *     summary: Create a new text instance
 *     description: Creates a new instance for a specific text in the OpenPecha API
 *     tags: [Texts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The text ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               metadata:
 *                 type: object
 *                 properties:
 *                   type:
 *                     type: string
 *                     description: Instance type (e.g., diplomatic)
 *                   copyright:
 *                     type: string
 *                     description: Copyright information
 *                   bdrc:
 *                     type: string
 *                     description: BDRC identifier
 *                   colophon:
 *                     type: string
 *                     description: Colophon text
 *                   incipit_title:
 *                     type: object
 *                     properties:
 *                       en:
 *                         type: string
 *                         description: English incipit title
 *                       bo:
 *                         type: string
 *                         description: Tibetan incipit title
 *               annotation:
 *                 type: array
 *                 description: Annotation data
 *                 items:
 *                   type: object
 *                   properties:
 *                     span:
 *                       type: object
 *                       properties:
 *                         start:
 *                           type: integer
 *                         end:
 *                           type: integer
 *                     index:
 *                       type: integer
 *                     alignment_index:
 *                       type: array
 *                       items:
 *                         type: integer
 *               content:
 *                 type: string
 *                 description: The text content
 *             example:
 *               metadata:
 *                 type: "diplomatic"
 *                 copyright: "public"
 *                 bdrc: "W123456"
 *                 colophon: "Sample colophon text"
 *                 incipit_title:
 *                   en: "Opening words"
 *                   bo: "དབུ་ཚིག"
 *               annotation:
 *                 - span:
 *                     start: 0
 *                     end: 20
 *                   index: 0
 *                   alignment_index: [0]
 *               content: "This is the text content to be stored"
 *     responses:
 *       201:
 *         description: Text instance created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               description: Created instance data
 *       400:
 *         description: Bad request - invalid input data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post("/:id/instances", async (req, res) => {
  try {
    const { id } = req.params;
    const instanceData = req.body;
    
    // Validate required fields
    if (!instanceData.content) {
      return res.status(400).json({
        error: 'Missing required field',
        details: 'content is required'
      });
    }

    const apiUrl = `${API_ENDPOINT}/texts/${id}/instances`;

    const response = await axios.post(apiUrl, instanceData, {
      headers: {
        'accept': 'application/json',
        'content-type': 'application/json'
      }
    });

    res.status(201).json(response.data);
  } catch (error) {
    console.error('Error creating text instance:', error.message);
    if (error.response) {
      // Forward the error response from OpenPecha API
      res.status(error.response.status).json({
        error: 'Failed to create text instance in OpenPecha API',
        details: error.response.data || error.message
      });
    } else {
      res.status(500).json({
        error: 'Failed to create text instance',
        details: error.message
      });
    }
  }
});

router.get("/instances/:instanceId", async (req, res) => {
  const { instanceId } = req.params;
  const apiUrl = `${API_ENDPOINT}/instances/${instanceId}`;
  const response = await axios.get(apiUrl, {
    headers: {
      'accept': 'application/json'
    }
  });
  res.json(response.data);
});




module.exports = router;
