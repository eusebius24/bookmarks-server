function makeBookmarksArray() {
    return [
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
    ];
}

function makeMaliciousBookmark() {
    const maliciousBookmark = {
        id: 911,
        title: 'Very naughty <script>alert("xss")</script>',
        url: 'https://does-not-exist.com',
        description: `Bad image <img src="https://url.to.file.which/does-not.exist" onerror="alert(document.cookie);">. But not <strong>all</strong> bad.`,
        rating: 3
    }
    const expectedBookmark = {
      ...maliciousBookmark,
      title: 'Very naughty &lt;script&gt;alert(\"xss\")&lt;/script&gt;',
      content: `Bad image <img src="https://url.to.file.which/does-not.exist">. But not <strong>all</strong> bad.`
    }
    return {
      maliciousBookmark,
      expectedBookmark,
    }
  }

module.exports = {
    makeBookmarksArray,
    makeMaliciousBookmark,
}