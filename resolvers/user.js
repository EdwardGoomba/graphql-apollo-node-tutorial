const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const { users, tasks } = require('../constants');
const User = require('../database/models/user');

module.exports = {
    Query: {
        users: () => users,
        user: (_, { id }, { email }) => {
            console.log('===', email)
            return users.find(user => user.id === id)
        }
    },
    Mutation: {
        signup: async (_, { input }) => { // _ parent, input destructure from args
            try {
                const user = await User.findOne({ email: input.email });
                if (user) {
                    throw new Error('Email already in use');
                }
                // pass the text and salt string or have bcrypt generate for you by passing the SaltRound (10-12 recommended)
                const hashedPassword = await bcrypt.hash(input.password, 12);
                const newUser = new User({ ...input, password: hashedPassword });
                const result = await newUser.save();
                return result;
            } catch (err) {
                console.log(err);
                throw err;
            }
        },
        login: async (_, { input }) => {
            try {
                const user = await User.findOne({ email: input.email });
                if (!user) {
                    throw new Error('User not found');
                }
                const isPasswordValid = await bcrypt.compare(input.password, user.password);//user.password is hashed password
                if (!isPasswordValid) {
                    throw new Error('Incorrect password');
                }
                const secret = process.env.JWT_SECRET_KEY || 'mysecretkey';
                const token = jwt.sign({ email: user.email }, secret, { expiresIn: '1d' });//see npm page for expiresIn info
                return { token };
            } catch (err) {
                console.log(err);
                throw err;
            }
        }
    },
    User: {
        tasks: ({ id }) => tasks.filter(task => task.userId === id),// expected iterable but not find one so change from find to filter because find returns an obj and filter returns array of obj
    }
}

// how you get the data for particular schema
// resolver args 
// 1) root/parent - result returned from the resolver on parent field
// 2) args - an obj w args passed into the field
// 3) context - shared by all resolvers, contain per-request state (auth, loaders, etc)
// 4) resolverInfo - contains query field-specific info like field name, path to field from root, etc 