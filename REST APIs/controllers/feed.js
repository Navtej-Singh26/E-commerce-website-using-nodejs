const { validationResult } = require('express-validator/check');
const path = require('path');

const Post = require('../models/post');

exports.getPosts = (req, res, next) => {
    Post.find()
        .then(posts => {
            res.status(200).json({message: 'Posts fetched Successfully', posts: posts});
        })
        .catch(err => {
            if(!err.statusCode){
                err.statusCode = 500;
            }
            next(err);
        });
};

exports.createPost = (req, res, next) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        const error = new Error('validation failed');
        error.statusCode = 422;
        throw error;
    }
    if(!req.file) {
        const error = new Error('No Image Provided')
        error.statusCode = 422;
        throw error;
    }
    const imageUrl = req.file.destination + '/' + req.file.filename;
    const title = req.body.title;
    const content = req.body.content;
    const post = new Post({
        title: title,
        creator: {name: 'Navtej Singh'},
        imageUrl: imageUrl,
        content: content,
    });
    post
        .save()
        .then(result => {
            res.status(201).json({
                message: 'Post created Successfully',
                post: result
            });
        })
        .catch(err => {
            if(!err.statusCode){
                err.statusCode = 500;
            }
            next(err);
        });
    
};

exports.getPost = (req, res, next) => {
    const postId = req.params.postId;
    Post.findById(postId)
        .then(post => {
            if(!post){
                const error = new Error('Could not find post.');
                error.statusCode = 400;
                throw error;
            }
            res.status(200).json({message: 'Post Fetched', post: post});
        })
        .catch(err => {
            if(!err.statusCode){
                err.statusCode = 500;
            }
            next(err);
        });
};

exports.updatePost = (req, res, next) => {
    const postId = req.params.postId;
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        const error = new Error('validation failed');
        error.statusCode = 422;
        throw error;
    }
    if(!req.file) {
        const error = new Error('No Image Provided')
        error.statusCode = 422;
        throw error;
    }
    const title = req.body.title;
    const content = req.body.content;
    let imageUrl = req.body.image;
    if(req.file){
        imageUrl = req.file.destination + '/' + filename;
    }
    if(!imageUrl){
        const error = new Error('No image Picked.');
        error.statusCode = 422;
        throw error;
    }
    Post.findById(postId)
};