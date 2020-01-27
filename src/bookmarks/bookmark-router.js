const express = require('express');
const uuid = require('uuid/v4')
const logger = require('../logger')
const { bookmarks } = require('../store')

const bookmarkRouter = express.Router()
const bodyParser = express.json()

bookmarkRouter
    .route('/bookmarks')
    .get((req, res) => {
        res.json(bookmarks);
    })
    .post(bodyParser, (req, res) => {
        const { title, url, description, rating } = req.body;

        if (!title) {
            logger.error(`Title is required`);
            return res
            .status(400)
            .send('Invalid data');
        }

        if (!url) {
            logger.error(`URL is required`);
            return res
            .status(400)
            .send('Invalid data');
        }

        const id = uuid();

        const bookmark = {
            id,
            title,
            url,
            description,
            rating
        };

        bookmarks.push(bookmark);
        logger.info(`Bookmark with id ${id} created`);

        res
            .status(201)
            .location(`http://localhost:8000/bookmarks/${id}`)
            .json(bookmark);
    })

bookmarkRouter
    .route('/bookmarks/:id')
    .get((req, res) => {
        const { id } = req.params;
         const bookmark = bookmarks.find(bkmk => bkmk.id == id);

        if (!bookmark) {
            logger.error(`Bookmark with id ${id} not found.`);
            return res
            .status(404)
            .send('Bookmark Not Found');
        }
        res.json(bookmark);
    })
    .delete((req, res) => {
        const { id } = req.params;

        const bookmarkIndex = bookmarks.findIndex(bkmk => bkmk.id == id);

        if(bookmarkIndex === -1) {
            logger.error(`Bookmark with id ${id} not found.`);
            return res
            .status(404)
            .send('Not Found');
        }

        bookmarks.splice(bookmarkIndex, 1);

        logger.info(`Bookmark with id ${id} deleted.`);
        res
            .status(204)
            .end();
    })

module.exports = bookmarkRouter