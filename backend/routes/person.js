const express = require('express');
const axios = require('axios');
const router = express.Router();
require('dotenv').config();

const API_ENDPOINT = process.env.OPENPECHA_ENDPOINT;

/**
 * @swagger
 * components:
 *   schemas:
 *     Person:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Unique identifier for the person
 *         name:
 *           type: string
 *           description: Full name of the person
 *         bdrc_id:
 *           type: string
 *           description: Buddhist Digital Resource Center ID
 *         birth_year:
 *           type: integer
 *           description: Birth year
 *         death_year:
 *           type: integer
 *           description: Death year
 *         nationality:
 *           type: string
 *           description: Nationality of the person
 *         occupation:
 *           type: string
 *           description: Occupation or profession
 *         description:
 *           type: string
 *           description: Biographical description
 *         wiki_url:
 *           type: string
 *           format: uri
 *           description: Wikipedia URL
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: Creation timestamp
 *         updated_at:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 *     Error:
 *       type: object
 *       properties:
 *         error:
 *           type: string
 *           description: Error message
 *         details:
 *           type: string
 *           description: Detailed error information
 */

/**
 * @swagger
 * tags:
 *   name: Persons
 *   description: Endpoints for managing and retrieving persons
 */

/**
 * @swagger
 * /person:
 *   get:
 *     summary: Get persons from OpenPecha API
 *     description: Retrieves a paginated list of persons with optional filtering.
 *     tags: [Persons]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 30
 *         description: Maximum number of persons to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Number of persons to skip
 *       - in: query
 *         name: nationality
 *         schema:
 *           type: string
 *         description: Filter persons by nationality
 *       - in: query
 *         name: occupation
 *         schema:
 *           type: string
 *         description: Filter persons by occupation
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search persons by name (English or Tibetan) or any text field
 *     responses:
 *       200:
 *         description: Successfully retrieved persons
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 results:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Person'
 *                 count:
 *                   type: integer
 *                   description: Total number of persons
 *                 limit:
 *                   type: integer
 *                   description: Number of items per page
 *                 offset:
 *                   type: integer
 *                   description: Number of items skipped
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/', async (req, res) => {
  try {
    const { limit = 10, offset = 0, nationality, occupation } = req.query;

    // Build query parameters for OpenPecha API
    const queryParams = new URLSearchParams();
    if (nationality) queryParams.append('nationality', nationality);
    if (limit) queryParams.append('limit', limit);
    if (offset) queryParams.append('offset', offset);
    if (occupation) queryParams.append('occupation', occupation);

    const apiUrl = `${API_ENDPOINT}/persons${queryParams.toString() ? '?' + queryParams.toString() : ''}`;


    const response = await axios.get(apiUrl, {
      headers: {
        'accept': 'application/json'
      }
    });

 
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching persons:', error.message);
    res.status(500).json({
      error: 'Failed to fetch persons from OpenPecha API',
      details: error.message
    });
  }
});

/**
 * @swagger
 * /person/{id}:
 *   get:
 *     summary: Get a person by ID from OpenPecha API
 *     description: Retrieves a single person by their ID.
 *     tags: [Persons]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The person ID
 *     responses:
 *       200:
 *         description: Successfully retrieved person
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Person'
 *       404:
 *         description: Person not found
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
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const apiUrl = `${API_ENDPOINT}/persons/${id}`;
    const response = await axios.get(apiUrl, {
      headers: {
        'accept': 'application/json'
      }
    });
    res.json(response.data);
  } catch (error) {
    if (error.response && error.response.status === 404) {
      res.status(404).json({
        error: 'Person not found',
        details: error.message
      });
    } else {
      console.error('Error fetching person:', error.message);
      res.status(500).json({
        error: 'Failed to fetch person from OpenPecha API',
        details: error.message
      });
    }
  }
});

/**
 * @swagger
 * /person:
 *   post:
 *     summary: Create a new person
 *     description: Creates a new person in the OpenPecha API.
 *     tags: [Persons]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: object
 *                 properties:
 *                   en:
 *                     type: string
 *                     description: English name
 *                   bo:
 *                     type: string
 *                     description: Tibetan name
 *                 required: [en, bo]
 *               alt_names:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     en:
 *                       type: string
 *                     bo:
 *                       type: string
 *                 description: Alternative names
 *               bdrc:
 *                 type: string
 *                 description: Buddhist Digital Resource Center ID
 *               wiki:
 *                 type: string
 *                 format: uri
 *                 description: Wikipedia URL
 *             example:
 *               name:
 *                 en: "tenzin kunsang"
 *                 bo: "ཀུན་བཟང་"
 *               alt_names:
 *                 - en: "bhu nyamchung"
 *                   bo: "test"
 *               bdrc: ""
 *               wiki: ""
 *     responses:
 *       201:
 *         description: Person created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Person'
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
    const { name, alt_names = [], bdrc = '', wiki = '' } = req.body;

    // Validate required fields
    if (!name || (!name.en && !name.bo)) {
      return res.status(400).json({
        error: 'Name is required with at least one language (en or bo)',
        details: 'Please provide a name in English or Tibetan'
      });
    }

    // Prepare the data for OpenPecha API
    const personData = {
      name,
      alt_names,
      bdrc,
      wiki
    };

    const apiUrl = `${API_ENDPOINT}/persons`;
    const response = await axios.post(apiUrl, personData, {
      headers: {
        'accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });

    res.status(201).json(response.data);
  } catch (error) {
    console.error('Error creating person:', error.message);
    
    if (error.response) {
      // Forward the error response from OpenPecha API
      res.status(error.response.status).json({
        error: 'Failed to create person in OpenPecha API',
        details: error.response.data || error.message
      });
    } else {
      res.status(500).json({
        error: 'Failed to create person',
        details: error.message
      });
    }
  }
});

module.exports = router;
