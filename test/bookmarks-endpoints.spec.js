const { expect } = require('chai')
const knex = require('knex')
const app = require('../src/app')

describe('Bookmarks Endpoints', function() {
    let db 

    before('make knex instance', () => {
        db = knex({
            client: 'pg',
            connection: process.env.TEST_DB_URL,
        })
        app.set('db', db)
    })

    after('disconnect from db', () => db.destroy())

    before('clean the table', () => db('bookmarks').truncate())

    context('Given there are bookmarks in the database', () => {
        const testBookmarks = [
            {
                id: 1,
                title: 'Google',
                url: 'https://www.google.com',
                description: 'The website that knows everything',
                rating: 3,
            },
            {
                id: 2,
                title: 'Figure Skating Universe',
                url: 'https://www.fsuniverse.net',
                description: 'The source of all truth',
                rating: 5,
            },
            {
                id: 3,
                title: 'Wikipedia',
                url: 'https://www.wikipedia.org',
                description: 'The website that may not know anything',
                rating: 3,
            },
        ]

        beforeEach('insert bookmarks', () => {
            return db
                .into('bookmarks')
                .insert(testBookmarks)
        })

        it(`GET /bookmarks responds with 200 and all of the bookmarks`, () => {
            return supertest(app)
                .get('/articles')
                .expect(200)
                //TODO
        })
    })
})