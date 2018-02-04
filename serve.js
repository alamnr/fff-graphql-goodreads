const express = require('express')
const graphqlHTTP = require('express-graphql')
const app = express()

const schema = require('./schema')


const fetch = require('node-fetch')
const util = require('util')
const DataLoader = require('dataloader')
const parseXml = util.promisify(require('xml2js').parseString)


const fetchAuthor = id => fetch(`https://www.goodreads.com/author/show.xml?id=${id}&key=02BwEOStDUpVLAoHbkO1g`)
    .then(response => response.text())
    .then(parseXml)


const fetchBook = id => fetch(`https://www.goodreads.com/book/show/${id}.xml?key=02BwEOStDUpVLAoHbkO1g`)
    .then(response => response.text())
    .then(parseXml)



app.use('/graphql', graphqlHTTP(req => {
    const authorLoader = new DataLoader(keys => Promise.all(keys.map(fetchAuthor)))
    const bookLoader = new DataLoader(keys => Promise.all(keys.map(fetchBook)))

    return {
        schema,
        context: {
            authorLoader,
            bookLoader
        },
    graphiql: true
    }
}))

app.listen(4000)

console.log('Listneing at port 4000...')