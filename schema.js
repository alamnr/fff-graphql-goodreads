



const{
    GraphQLSchema,
    GraphQLObjectType,
    GraphQLInt,
    GraphQLString,
    GraphQLList
} = require('graphql')

/*
const x = fetch('https://www.goodreads.com/author/show.xml?id=4432&key=92WHmqw4RL2nx76JiypQ')
.then(response => response.text())
.then(parseXml)
*/

function translate(lang, str){
    // Google translate API is a paid service 
    // To generate your own go here : https://cloud.google.com/translate/v2/getting started
    const apiKey = 'AIzaSyBn-dvfndjfngvkxvjlxlkjvcbllkxcb'
    const url = `https://googleapis.com/language/translate/v2?key=${apiKey}&source=en&target=${lang}&q=${encodeURIComponent(str)}`
    return fetch(url)
    .then(response=>response.json())
    .then(parsedResponse=>
    parsedResponse
    .data
    .translations[0]
    .translatedText
)
}


const BookType = new GraphQLObjectType({
    name: 'Book',
    description:'...',

    fields: () => ({
        title:{
            type: GraphQLString,
            //resolve: xml=>xml.title[0]
            args:{
                lang:{type: GraphQLString}
            },
           // resolve: xml=>xml.GoodreadsResponse.book[0].title[0]
           resolve: (xml,args)=>{
                const title =  xml.GoodreadsResponse.book[0].title[0]
                return args.lang ? translate(args.lang, title) : title
           }
        },
        isbn:{
            type: GraphQLString,
            //resolve: xml => xml.isbn[0]
            resolve: xml => xml.GoodreadsResponse.book[0].isbn[0]
        },
        authors:{
            type: new GraphQLList(AuthorType),
            resolve: (xml,args,context) => {
                const authorElements = xml.GoodreadsResponse.book[0].authors[0].author
                const ids = authorElements.map(elem=>elem.id[0])
                return context.authorLoader.loadMany(ids)
                    
                    
                }
                    
        }
    })
})


const AuthorType = new GraphQLObjectType({
    name: 'Author',
    description:'...',

    fields: ()=>({
        name: {
            type: GraphQLString,
            resolve: xml => xml.GoodreadsResponse.author[0].name[0]
            
        },
        books:{
            type: new GraphQLList(BookType),
            //resolve: xml => xml.GoodreadsResponse.author[0].books[0].book
            resolve:(xml,args,context)=> { 
                const ids = xml.GoodreadsResponse.author[0].books[0].book.map(elem=> elem.id[0]._)
                //console.log('Fetching Books...'+ ids)
                return context.bookLoader.loadMany(ids)
            }
        }
    })
})

module.exports = new GraphQLSchema({
    query: new GraphQLObjectType({
        name:'Query',
        description:'...',

        fields: ()=>({
            author:{
                type: AuthorType,
                args:{
                    id:{type:GraphQLInt}
                },
                resolve:(root, args,context)=>context.authorLoader.load(args.id)
                
            }
        })
    })
})