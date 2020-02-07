const express = require('express');
const xss = require('xss')

const BookmarksService = require('./bookmarks-service')

const bookmarksRouter = express.Router()
const jsonParser = express.json()

const serializeBookmark = bookmark => ({
    id: bookmark.id,
    title: xss(bookmark.title),
    url: bookmark.url,
    description: xss(bookmark.description),
    rating: bookmark.rating,
})

function validateURL (url) {
    const pattern = /(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/;
    if(pattern.test(url)) {
        return true;
    }
    return false;
}

bookmarksRouter
    .route('/')
    .get((req, res, next) => {
        const knexInstance = req.app.get('db')
        BookmarksService.getAllBookmarks(knexInstance)
            .then (bookmarks => {
                res.json(bookmarks.map(serializeBookmark))
            })
            .catch(next)
    })
    .post(jsonParser, (req, res, next) => {
        const { title, url, description, rating } = req.body;
        const newBookmark = { title, url, description, rating }

        for (const [key, value] of Object.entries(newBookmark)) {
            if (value == null) {
                return res.status(400).json({
                    error: { message: `Missing '${key}' in request body`}
                })
            }
        }

        if(newBookmark.rating < 1 || newBookmark.rating > 5) {
            return res.status(400).json({
                error: { message: `Rating must be between 1 and 5` }
            })
        }

        if(typeof(newBookmark.title) !== "string") {
            return res.status(400).json({
                error: { message: `Title must be a text string` }
            })
        }

       const valid = validateURL(newBookmark.url);

       if(!valid) {
           return res.status(400).json({
               error: { message: `Not a valid URL` }
           })
       }


        BookmarksService.insertBookmark(
            req.app.get('db'),
            newBookmark
        )
            .then(bookmark => {
                res
                    .status(201)
                    .location(`/bookmarks/${bookmark.id}`)
                    .json({
                        id: bookmark.id,
                        title: xss(bookmark.title),
                        url: bookmark.url,
                        description: xss(bookmark.description),
                        rating: bookmark.rating,
                    })
            })
            .catch(next)
    })

bookmarksRouter
    .route('/:bookmark_id')
    .get((req, res, next) => {
        const knexInstance = req.app.get('db')
        BookmarksService.getById(knexInstance, req.params.bookmark_id)
            .then(bookmark => {
                if(!bookmark) {
                    return res.status(404).json({
                        error: { message: `Bookmark doesn't exist` }
                    })
                }
                res.json({
                    id: bookmark.id,
                    title: xss(bookmark.title),
                    url: bookmark.url,
                    description: xss(bookmark.description),
                    rating: bookmark.rating,
                })
            })
            .catch(next)
    })
    .delete((req, res, next) => {
        BookmarksService.deleteBookmark(
            req.app.get('db'),
            req.params.bookmark_id
        )
            .then(() => {
                res.status(204).end()
            })
            .catch(next)
    })
    

module.exports = bookmarksRouter