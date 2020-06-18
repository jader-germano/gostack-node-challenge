const express = require('express');
const { uuid, isUuid } = require('uuidv4');
const cors = require('cors');

const app = express();

app.use(express.json());
app.use(cors());
const repositories = [];
let likes = new Map();

function logRequests(request, response, next) {
    const { method, url } = request;

    const logLabel = `[${method.toUpperCase()} ${url}]`;
    console.time(logLabel);
    next();
    console.timeEnd(logLabel);
}

function validateRepositoryId(request, response, next) {
    const { id } = request.params;
    if (!isUuid(id)) {
        return response.status(400)
        .json({ error: 'Invalid repository ID.' })
    }
    return next();
}

app.use(logRequests);
app.use('/repositories:id', validateRepositoryId);

app.get('/repositories', (request, response) => {
    const { title } = request.query;

    const results = title
        ? repositories.filter(repo => repo.title.includes(title))
        : repositories;

    let resultsMounted = results.map(repo => {
        let like = likes.get(repo.id);
        let likesLength = like.length > 0 ? like.length - 1 : like.length
        return {
            ...repo,
            likes: like[likesLength]
        }
    });
    return response.json(resultsMounted);
});

app.post('/repositories', (request, response) => {
    const { url, title, techs } = request.body;
    let like = 0
    let id = uuid();
    const repository = {
        id,
        title,
        url,
        techs,
    };
    repositories.push(repository);
    likes.set(id, [like]);
    let returnLike = likes.get(id);
    let likesLength = returnLike.length > 0 ? returnLike.length - 1 : returnLike.length;
    return response.json({
        ...repository,
        likes: returnLike[likesLength]
    });
});

app.put('/repositories:id', (request, response) => {
    const { id } = request.params;
    const { url, title, techs } = request.body;

    const repositoryIndex = repositories.findIndex(pjr => pjr.id === id);
    if (repositoryIndex < 0) {
        return response.status(400)
        .json({ error: 'Repository not found.' });
    }
    const repository = {
        id,
        url,
        title,
        techs
    };

    repositories[repositoryIndex] = repository;
    let returnLike = likes.get(id);
    return response.json({
        ...repository,
        likes: returnLike[returnLike.length - 1]
    });
});

app.delete('/repositories/:id', async (request, response) => {
    const { id } = request.params;
    likes.delete(id);
    console.log(likes)
    const repositoryIndex = repositories.findIndex(repository => repository.id === id);

    if (repositoryIndex < 0) {
        return response.status(400)
        .json({ error: 'Repository not found.' });
    }

    repositories.splice(repositoryIndex, 1);

    return response
    .status(204)
    .send();
});

app.post('/repositories/:id/like', (request, response) => {

    const { id } = request.params;

    let repository = repositories.find(pjr => pjr.id === id);

    let returnLike = likes.get(id);

    if (!repository) {
        return response.status(400)
        .json({ error: 'Repository not found.' });
    }

    let likesLength = returnLike.length > 0 ? returnLike.length - 1 : returnLike.length;

    let newLikeVal = returnLike[likesLength] + 1;

    likes.set(id, [...returnLike, newLikeVal]);
    repository = repositories.find(pjr => pjr.id === id);
    return response.json({
        ...repository,
        likes: newLikeVal,
    });
});

module.exports = app;
