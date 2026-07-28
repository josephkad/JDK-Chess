import dotenv from 'dotenv';
dotenv.config(); // Read .env files

import express from 'express';
import User from './src/client/User.ts';
import passport from 'passport';
import { Strategy as GoogleStrategy } from "passport-google-oauth20";

import mongoose from 'mongoose';
await mongoose.connect(process.env.MONGO_URI!);

import cors from 'cors';
import session from 'express-session';
import { json } from 'stream/consumers';
import { Chess, type Square } from 'chess.js';
import MongoStore from "connect-mongo";

import Stripe from "stripe";
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const apiURl = process.env.VITE_API_URL
const webURL = process.env.VITE_WEB_URL
const port = process.env.VITE_API_URL;
const portNum = process.env.PORT || 3000 
const stripePriceID = process.env.STRIPE_PRICE_ID

const loggedOutURL = webURL!;
const loggedInURL = loggedOutURL + '/dashboard';
const app = express();
const testing = true;

app.set("trust proxy", 1);

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.CLIENT_ID!, //! to remove red lines, it tells typescript that this isnt undefined
      clientSecret: process.env.CLIENT_SECRET!,
      callbackURL: `${port}/auth/google/callback`,
    },
    async (accessToken, refreshToken, profile, done) => {
      let user = await User.findOne({googleId: profile.id});

      if (!user) {
        user = await User.create({
          email: profile.emails?.[0].value,
          googleId: profile.id,
          displayName: profile.displayName,
          photo: profile.photos?.[0].value,
        });
      }

      done(null, user)
    }
  )
);

app.use(cors({
    origin: loggedOutURL,
    credentials: true
}));

app.post("/api/stripe/webhook", express.raw({type:'application/json'}), async (req,res)=>{
  let event

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      req.headers["stripe-signature"]!,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch(err) {
    console.log('Webhook error:', err)
    return res.status(400).send('Webhook failed')
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const userId = session.metadata?.userId;
    if (!session.subscription) return res.status(409).send("No subscription ID");

    const subscriptionId = typeof session.subscription === "string" ? session.subscription : session.subscription.id;
    const subscription : any = await stripe.subscriptions.retrieve(subscriptionId);
    if (!subscription) return res.status(400).send("No subscription ID");
    
    const updatedUser = await User.findByIdAndUpdate(userId, {
        subscription: {
          status: subscription.status,
          stripeCustomerId: session.customer,
          stripeSubscriptionId: session.subscription,
          currentPeriodEnd: new Date(subscription.items.data[0].current_period_end * 1000)
      }
    },{returnDocument : 'after'});
  }

  if (event.type === "customer.subscription.deleted") {
    const subscription = event.data.object;

    const updatedUser = await User.findOneAndUpdate(
        {
            "subscription.stripeSubscriptionId": subscription.id
        },
        {
            "subscription.status": "free"
        },
        {
            returnDocument: "after"
        }
    );
  }

  if (event.type === "customer.subscription.updated") {
    const subscription = event.data.object;

    const updatedUser = await User.findOneAndUpdate(
        {
            "subscription.stripeSubscriptionId": subscription.id
        },
        {
            "subscription.status": subscription.status,
            "subscription.currentPeriodEnd":
                new Date(subscription.items.data[0].current_period_end * 1000)
        },
        {
            returnDocument: "after"
        }
    );
  }

  res.json({recieved: true})
});

app.use(express.json());
app.use(session({secret: process.env.SESSION_SECRET!, resave: false, saveUninitialized: false,
  proxy: true,
  store: MongoStore.create({
      mongoUrl: process.env.MONGO_URI!
  }),
  cookie: {
      secure: true,
      httpOnly: true,
      sameSite: "none"
  },
}))
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user : any, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id : string, done) => {
  const user = await User.findById(id);
  done(null, user);
});

app.get("/auth/google",
    passport.authenticate("google", {
        scope: ["profile", "email"],
        prompt: 'select_account',
    })
);

/*app.get('/auth/google/callback', passport.authenticate('google', {
  failureRedirect: loggedOutURL
}),
(req, res) => {
  console.log("OAuth user:", req.user);
    console.log("Headers:", res.getHeaders());
  console.log('other headers:', res.getHeaders()["set-cookie"]);
  res.redirect(loggedInURL);
});*/
app.get(
  "/auth/google/callback",
  passport.authenticate("google", { failureRedirect: loggedOutURL }),
  (req, res) => {
    req.session.save(() => {
      console.log("Session saved");
      console.log("Headers:", res.getHeaders());

      res.redirect(loggedInURL);
    });
  }
);

app.get('/api/user', (req, res)=>{
    if (!req.isAuthenticated()) {
        return res.status(401).json({ error: 'Not authenticated' });
    };
    res.json(req.user);
});

app.get('/logout', (req, res, next)=>{
    req.logout((err) =>{
        if (err) return next (err);

        req.session.destroy(() =>{
            res.clearCookie('connect.sid')
            res.redirect(loggedOutURL);
        });
    })
})

// {Posts}

// Functions
interface statsObject{
  action: number;
  games: number;
  percent?: number;
}

async function getGames(username : string, months : number) {
  const archivesRes = await fetch(
    `https://api.chess.com/pub/player/${username}/games/archives`
  );

  const archives = await archivesRes.json();
  if (archives.code == 0) {return null}
  const recentArchives = archives.archives.slice(-months);

  let allGames: any[] = [];

  for (const archive of recentArchives) {
    const gameRes = await fetch(archive);
    const data = await gameRes.json();
    allGames.push(...data.games);
  }

  return allGames;
}

function getOpeningName(ecoUrl: string) {
  if (ecoUrl == undefined) {return 'Undefined'}
  const name = ecoUrl.split('/openings/')[1].replaceAll('-', ' ');
  return name.split(' ').slice(0, 2).join(' ');
}

function increaseObjectOpening(object : Record<string, statsObject>, openingName : string, justGames? : boolean) {
  if (object[openingName]) {
    if (justGames) {
      object[openingName].games += 1
    } else {
      object[openingName].action += 1
      object[openingName].games += 1
    }
  } else if (!justGames) {
    object[openingName] = {action: 1, games: 1}
  }
}

function getStats(games : Array<any>, chessName : string, timeClass : string) {
  if (!games) {return null};
  const winResults = ['win'];
  const loseResults = ['lose', 'checkmated', 'timeout', 'resigned', 'abandoned']
  const drawResults = ['agreed', 'repetition', 'stalemate', 'insufficient', '50move', 'timevsinsufficient'];

  let opponent_ratings = [] as number[];
  let currentStreak = 0;

  let openings_won_with: Record<string, statsObject> = {}
  let openings_lost_to: Record<string, statsObject> = {}
  let openings_faced: Record<string, statsObject> = {}

  let stats = {
    games_won: 0,
    games_lost: 0,
    games_draw: 0,

    openings_won_with: {},
    openings_lost_to: {},
    openings_faced: {},
    all_games_lost: [] as any,

    total_games: 0,
    win_rate: 0,
    best_streak: 0,
    average_opponent_rating: 0,
    highest_rating: 0,

    loss_rate: 0,
    draw_rate: 0,
  }

  function endStreak() {
    if (currentStreak > 0) {
      if (currentStreak > stats.best_streak) {
        stats.best_streak = currentStreak;
      }

      currentStreak = 0;
    }
  }

  games.forEach((item, _) => {
    if (item.time_class != timeClass) {return};
    const gameFilter = item.white.username == chessName? item.white : item.black;
    const opponent = item.white.username == chessName? item.black : item.white;
    const openingName = getOpeningName(item.eco);
    if (openingName == 'Undefined') {return}
    
    // games_won
    if (winResults.includes(gameFilter.result)) {
      stats.games_won += 1;
      currentStreak += 1;

      //openings_won_with
      increaseObjectOpening(openings_won_with, openingName);
    } else {
      increaseObjectOpening(openings_won_with, openingName, true);
    }

    //games_lost
    if (loseResults.includes(gameFilter.result)) {
      stats.games_lost += 1;
      stats.all_games_lost.push(item)

      // best streak
      endStreak()

      //openings_lost_to
      increaseObjectOpening(openings_lost_to, openingName)
    } else {
      increaseObjectOpening(openings_lost_to, openingName, true)
    }

    //games_draw
    if (drawResults.includes(gameFilter.result)) {
      stats.games_draw += 1;

      // best streak
      endStreak()
    }

    //openings_faced
    increaseObjectOpening(openings_faced, openingName)

    //total_games
    stats.total_games += 1

    //average_opponent_rating
    opponent_ratings.push(opponent.rating)
    
    //highest_rating
    if (gameFilter.rating > stats.highest_rating) {
      stats.highest_rating = gameFilter.rating;
    }
  });

  endStreak()

  let sum = 0

  for (let num of opponent_ratings) {
    sum += num;
  }

  stats.average_opponent_rating = Math.round(sum / opponent_ratings.length)
  stats.win_rate = Number(((stats.games_won / stats.total_games) * 100).toFixed(1))
  
  function editStats(object : Record<string, statsObject>) {
    for (const item in object) {
      const percent = Number(((object[item].action / object[item].games) * 100).toFixed(1))
      object[item].percent = percent
    }
  };

  editStats(openings_won_with);
  editStats(openings_lost_to);

  const wonWith = Object.entries(openings_won_with).sort((a, b) => b[1].action - a[1].action);
  const lostTo = Object.entries(openings_lost_to).sort((a, b) => b[1].action - a[1].action);
  const faced = Object.entries(openings_faced).sort((a, b) => b[1].action - a[1].action);
  stats.openings_won_with = wonWith;
  stats.openings_lost_to = lostTo;
  stats.openings_faced = faced;

  stats.loss_rate = Number(((stats.games_lost / stats.total_games) * 100).toFixed(1));
  stats.draw_rate = Number(((stats.games_draw / stats.total_games) * 100).toFixed(1));
  return stats;
}

/*function getRandomGame(userStats : any) {
  if (!userStats) return null;
  let chosen = null;
  
  for (const lost_g of  userStats[0].all_games_lost) {
    if (chosen == null || Math.floor(Math.random() * 15) == 10) {
      const loadedGame = new Chess()
      loadedGame.loadPgn(lost_g.pgn)
      const loadedGameHistoryLength = loadedGame.history().length

      if (loadedGameHistoryLength < 10) continue;
      chosen = lost_g;
    }
  }

  return chosen;
}*/
function getRandomGame(userStats: any) {
  if (!userStats) return null;

  const games = userStats[0].all_games_lost;

  for (let i = 0; i < 10; i++) {
    const randomGame = games[Math.floor(Math.random() * games.length)];

    const loadedGame = new Chess();
    loadedGame.loadPgn(randomGame.pgn);

    if (loadedGame.history().length >= 10) {
      return randomGame;
    }
  }

  return null;
}

// Content
app.post('/api/saveStats', async (req, res) => {
  const username = req.body.username;
  const timeClass = req.body.timeClass;
  let months = req.body.months;

  if (months < 1 || months  > 12) {
    months = 4;
  };

  try{
    const games : any = await getGames(username, months);
    if (games == null) {return res.json({ success: false });}
    const stats = getStats(games, username, timeClass);
    const userId = (req.user as any)?.id;

    if (!userId) {
      return res.status(401).json({error: 'Not logged in'});
    }

    const updatedUser = await User.findByIdAndUpdate(userId, {
      stats: stats,
      chessUsername: username,
    },{returnDocument : 'after'});
    
    return res.json(updatedUser);
  } catch (err){
    console.log(err);
    return res.status(500).json({ success: false });
  }
})
//JnxZ_u

app.post("/api/create-checkout-session", async (req, res) => {
  const user = req.user
  const userId = user? (req.user as any)?.id : undefined;

  if (!user) {return res.status(404).json({error: 'No user found'})}

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",

    line_items: [
        {
            price: stripePriceID,
            quantity: 1,
        },
    ],

    success_url:
        `${webURL}/dashboard?success=true`,

    cancel_url:
        `${webURL}/dashboard/premium`,

    metadata: {
      userId: userId.toString()
    }
  });

  res.json({
    url: session.url
  });
});

app.post("/api/create-portal-session", async (req, res) => {
    const user : any = req.user;

    if (!user) {
        return res.status(401).json({
            error: "Not logged in"
        });
    }

    const session = await stripe.billingPortal.sessions.create({
        customer: user.subscription.stripeCustomerId,

        return_url:
            `${webURL}/dashboard/settings`
    });

    res.json({
        url: session.url
    });
});

app.get('/api/get-user-info', async (req, res) => {
  const user = req.user as any
  if (!user) return res.status(401).json({error: 'Not logged in'})
  res.json(user)
})

app.get('/api/get-practice-info', async (req, res) => {
  const user = req.user as any
  const userId = user? user.id : undefined
  const gameStats = user? user.gameStats : undefined
  if (!user) return res.status(401).json({error: 'Not logged in'})

  const dataSending = {positionsPracticed: 0, nextAvaliable: null, randomGame: null}
  const hasPremium = user.subscription.status === "active" && user.subscription.currentPeriodEnd > new Date();
  let canGiveGame = true
  
  if (hasPremium) {
    let remaining = gameStats.positionsPracticed
    let avaliable = gameStats.nextAvaliable

    if (gameStats.positionsPracticed < 1) {
      remaining = 11
      dataSending.positionsPracticed = remaining
    } else {
      dataSending.positionsPracticed = gameStats.positionsPracticed - 1
      remaining = dataSending.positionsPracticed
    }

    await User.findByIdAndUpdate(userId, {
      gameStats: {
        positionsPracticed: remaining,
        nextAvaliable: avaliable
      }
    });
  } else {
    let remaining = gameStats.positionsPracticed
    let avaliable = gameStats.nextAvaliable

    if (gameStats.positionsPracticed < 1) {
      if (avaliable && avaliable < new Date()) {
        remaining = 11
        avaliable = null
        dataSending.positionsPracticed = remaining
      } else {
        canGiveGame = false
        dataSending.positionsPracticed = remaining
        dataSending.nextAvaliable = avaliable
  
        if (!avaliable) {
          avaliable = new Date(Date.now() + 24 * 60 * 60 * 1000)
          dataSending.nextAvaliable = avaliable
        }
      }
    } else {
      dataSending.positionsPracticed = gameStats.positionsPracticed - 1
      remaining = dataSending.positionsPracticed

      if (remaining == 0 && !avaliable) {
        avaliable = new Date(Date.now() + 24 * 60 * 60 * 1000)
        dataSending.nextAvaliable = avaliable
      }
    }

    await User.findByIdAndUpdate(userId, {
      gameStats: {
        positionsPracticed: remaining,
        nextAvaliable: avaliable
      }
    });

  }

  if (canGiveGame) {
    dataSending.randomGame = getRandomGame(user.stats)
  }

  res.json(dataSending)
})

// Listen
app.listen(portNum, () => {
    console.log('server running');
});