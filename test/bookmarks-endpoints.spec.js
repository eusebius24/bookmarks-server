const { expect } = require('chai')
const knex = require('knex')
const app = require('../src/app')
const { makeBookmarksArray, makeMaliciousBookmark } = require('./bookmarks.fixtures')

describe.only('Bookmarks Endpoints', function() {
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

    afterEach('cleanup', () => db('bookmarks').truncate())

    describe( `GET /bookmarks`, () => {
        context(`Given no bookmarks`, () => {
            it(`responds witn 200 and an empty list`, () => {
                return supertest(app)
                    .get('/bookmarks')
                    .expect(200, [])
            })
        })

        context(`Given an XSS attack bookmark`, () => {
            const maliciousBookmark = {
                id: 911,
                title: 'Very naughty <script>alert("xss")</script>',
                url: 'https://does-not-exist.com',
                description: `Bad image <img src="https://url.to.file.which/does-not.exist" onerror="alert(document.cookie);">. But not <strong>all</strong> bad.`,
                rating: 3
            }

            beforeEach(`insert malicious bookmark`, () => {
                return db
                    .into('bookmarks')
                    .insert([ maliciousBookmark ])
            })

            it(`removes attack content`, () => {
                return supertest(app)
                    .get(`/bookmarks/${maliciousBookmark.id}`)
                    .expect(200)
                    .expect(res => {
                        expect(res.body.title).to.eql('Very naughty &lt;script&gt;alert(\"xss\")&lt;/script&gt;')
                        expect(res.body.description).to.eql(`Bad image <img src="https://url.to.file.which/does-not.exist">. But not <strong>all</strong> bad.`)
                    })

            })
        })

        context('Given there are bookmarks in the database', () => {
            const testBookmarks = makeBookmarksArray()
    
            beforeEach('insert bookmarks', () => {
                return db
                    .into('bookmarks')
                    .insert(testBookmarks)
            })
    
            it(`GET /bookmarks responds with 200 and all of the bookmarks`, () => {
                return supertest(app)
                    .get('/bookmarks')
                    .expect(200, testBookmarks)
            })
        })

        context('Given a malicious bookmark', () => {
            const testBookmarks = makeBookmarksArray()
            const { maliciousBookmark, expectedBookmark } = makeMaliciousBookmark()

            beforeEach('insert malicious bookmark', () => {
                return db
                    .into('bookmarks')
                    .insert([ maliciousBookmark ])
            })

            it(`sanitizes malicious bookmark`, () => {
                return supertest(app)
                    .get(`/bookmarks/${maliciousBookmark.id}`)
                    .expect(200)
                    .expect(res => {
                        expect(res.body.title).to.eql('Very naughty &lt;script&gt;alert(\"xss\")&lt;/script&gt;')
                        expect(res.body.description).to.eql(`Bad image <img src="https://url.to.file.which/does-not.exist">. But not <strong>all</strong> bad.`)

                    })
            })
        })
    })


    describe(`GET /bookmarks/:bookmark_id`, () => {
        context(`Given no bookmarks`, () => {
            it(`responds with 404`, () => {
                const bookmarkId = 123456
                return supertest(app)
                    .get(`/bookmarks/${bookmarkId}`)
                    .expect(404, { error: { message: `Bookmark doesn't exist` } })
            })
        })
        context('Given there are bookmarks in the database', () => {
            const testBookmarks = makeBookmarksArray()
    
            beforeEach('insert bookmarks', () => {
                return db
                    .into('bookmarks')
                    .insert(testBookmarks)
            })

            it(`GET /bookmarks/:bookmark_id responds with 200 and the specified bookmark`, () => {
                const bookmarkId = 2 
                const expectedBookmark = testBookmarks[bookmarkId - 1] 
                return supertest(app)
                    .get(`/bookmarks/${bookmarkId}`)
                    .expect(200, expectedBookmark)
            })
        }) 

        
    })

    describe(`POST /bookmarks`, () => {
        it(`creates a bookmark, responding with 201 and the new bookmark`, function() {
            const newBookmark = {
                title: 'Test new bookmark',
                url: 'https://www.example.com', 
                description: 'Test new bookmark description',
                rating: 3,
            }
            return supertest(app)
                .post('/bookmarks')
                .send(newBookmark)
                .expect(201)
                .expect(res => {
                    expect(res.body.title).to.eql(newBookmark.title)
                    expect(res.body.url).to.eql(newBookmark.url)
                    expect(res.body.description).to.eql(newBookmark.description)
                    expect(res.body.rating).to.eql(newBookmark.rating)
                    expect(res.body).to.have.property('id')
                    expect(res.headers.location).to.eql(`/bookmarks/${res.body.id}`)
                })
                .then(postRes => 
                    supertest(app)
                        .get(`/bookmarks/${postRes.body.id}`)
                        .expect(postRes.body)
                )
        })

        context(`Given an XSS attack bookmark`, () => {
            const maliciousBookmark = {
                id: 911,
                title: 'Very naughty <script>alert("xss")</script>',
                url: 'https://does-not-exist.com',
                description: `Bad image <img src="https://url.to.file.which/does-not.exist" onerror="alert(document.cookie);">. But not <strong>all</strong> bad.`,
                rating: 3
            }

            beforeEach(`insert malicious bookmark`, () => {
                return db
                    .into('bookmarks')
                    .insert([ maliciousBookmark ])
            })

            it(`removes attack content`, () => {
                return supertest(app)
                    .get(`/bookmarks/${maliciousBookmark.id}`)
                    .expect(200)
                    .expect(res => {
                        expect(res.body.title).to.eql('Very naughty &lt;script&gt;alert(\"xss\")&lt;/script&gt;')
                        expect(res.body.description).to.eql(`Bad image <img src="https://url.to.file.which/does-not.exist">. But not <strong>all</strong> bad.`)
                    })

            })
        })

        it(`responds with 400 and an error message when the 'title' is missing`, () => {
            return supertest(app)
                .post('/bookmarks')
                .send({
                    url: 'https://www.example.com',
                    description: 'Test new description ...',
                    rating: 3
                })
                .expect(400, {
                    error: { message: `Missing 'title' in request body` }
                })
        })

        it(`responds with 400 and an error message when the 'url' is missing`, () => {
            return supertest(app)
                .post('/bookmarks')
                .send({
                    title: 'Test new title',
                    description: 'Test new description ...',
                    rating: 3
                })
                .expect(400, {
                    error: { message: `Missing 'url' in request body` }
                })
        })

        it(`responds with 400 and an error message if the rating is not between 1 and 5`, () => {
            return supertest(app)
                .post('/bookmarks')
                .send({
                    title: 'Test new bookmark',
                    url: 'https://www.example.com', 
                    description: 'Test new bookmark description',
                    rating: 6,
                })
                .expect(400, {
                    error: { message: `Rating must be between 1 and 5`}
                })
        })

        it(`responds with 400 and an error message if the title is not a string`, () => {
            return supertest(app)
                .post('/bookmarks')
                .send({
                    title: 47,
                    url: 'https://www.example.com', 
                    description: 'Test new bookmark description',
                    rating: 5,
                })
                .expect(400, {
                    error: { message: `Title must be a text string`}
                })
        })

        it(`responds with 400 and an error message if the URL is not valid`, () => {
            return supertest(app)
                .post('/bookmarks')
                .send({
                    title: 'Test new title',
                    url: 'httpswww.example.com', 
                    description: 'Test new bookmark description',
                    rating: 5,
                })
                .expect(400, {
                    error: { message: `Not a valid URL` }
                })
        })
    })

    describe(`DELETE /bookmarks/:bookmark_id`, () => {
        context('Given there are bookmarks in the database', () => {
            const testBookmarks = makeBookmarksArray()

            beforeEach('insert bookmarks', () => {
                return db
                    .into('bookmarks')
                    .insert(testBookmarks)
            })

            it ('responds with 204 and removes the bookmark', () => {
                const idToRemove = 2 
                const expectedBookmarks = testBookmarks.filter(bookmark => bookmark.id !== idToRemove)
                return supertest(app)
                    .delete(`/bookmarks/${idToRemove}`)
                    .expect(204)
                    .then(res => 
                        supertest(app)
                            .get(`/bookmarks`)
                            .expect(expectedBookmarks)
                        )
            })
        })
    })
})