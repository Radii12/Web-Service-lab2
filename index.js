const { ApolloServer, gql } = require("apollo-server");
const axios = require("axios").default;
// data sources: DB, REST API, GRAPHQL
// SDL
const typeDefs = gql`
  type User {
    id: ID!
    name: String!
    email: String!
    posts: [Post]!
  }

  enum Gender {
    MALE
    FEMALE
  }

  input PaginationInput {
    page: Int!
    count: Int!
  }

  input PostInput {
    title: String!
    body: String!
  }

  type CreatePostResponse {
    message: String!
    id: ID!
  }

  input CommentInput {
    name: String!
    body: String!
  }

  type createCommentResponse {
    message: String!
    id: ID!
  }

  type Comment {
    id: ID!
    postId: ID
    name: String
    email: String
    body: String
  }

  type Post {
    id: ID!
    title: String
    body: String
    comments: [Comment]!
  }
  input PostIdInput {
    postId: String!
  }
  type Mutation {
    createPost(data: PostInput): CreatePostResponse
    createComment(
      data: CommentInput
      postId: PostIdInput
    ): createCommentResponse
  }

  type Query {
    me: String
    getProfile: User!
    users(pagination: PaginationInput!): [User!]!
    posts: [Post!]!
    comments: [Comment!]!
    getUserById(userId: String!): User!
    getPostById(postId: String!): Post!
  }
`;
// multiple round-trips 3 requests to get users with their posts
// fetch posts for user
const server = new ApolloServer({
  typeDefs,
  resolvers: {
    User: {
      posts: async (parent, args) => {
        console.log(parent);
        const postsResponse = await axios.get(
          `http://localhost:3000/users/${parent.id}/posts`
        );
        return postsResponse.data;
      },
    },
    Post: {
      comments: async (parent, args) => {
        const commentResponse = await axios.get(
          `http://localhost:3000/posts/${parent.id}/comments`
        );
        console.log(commentResponse.data);
        return commentResponse.data;
      },
    },
    Mutation: {
      createPost: async (parent, args) => {
        console.log(args);

        const response = await axios.post(
          `http://localhost:3000/users/1/posts`,
          { data: args.data }
        );

        return { message: "post created successfully", id: response.data.id };
      },
      createComment: async (parent, args) => {
        const { postId, name, body } = args.data;

        const response = await axios.post(
          `http://localhost:3000/posts/${postId}/comments`,
          { data: { name, body } }
        );

        return {
          message: "Comment created successfully",
          id: response.data.id,
        };
      },
    },
    Query: {
      getUserById: async (parent, args) => {
        const userId = args.userId;
        const response = await axios.get(
          `http://localhost:3000/users/${userId}`
        );
        return response.data;
      },
      users: async (parent, args) => {
        const {
          pagination: { count, page },
        } = args;
        const response = await axios.get(
          `http://localhost:3000/users?_limit=${count}&_page=${page}`
        );

        return response.data;
      },
      posts: async (_, args) => {
        const response = await axios.get(`http://localhost:3000/posts`);
        return response.data;
      },
      comments: async (_, args) => {
        const response = await axios.get(`http://localhost:3000/comments`);
        return response.data;
      },
      getPostById: async (_, args) => {
        const postId = args.postId;
        const response = await axios.get(
          `http://localhost:3000/posts/${postId}`
        );
        return response.data;
      },
    },
  },
});

// run express server on port 4000
server.listen(4000).then(() => {
  console.log("server started");
});
