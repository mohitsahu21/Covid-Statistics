const express = require('express')
const app = express()
const bodyParser = require("body-parser");
const port = 8080

// Parse JSON bodies (as sent by API clients)
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
const { connection } = require('./connector');
const { json } = require('express');

app.get("/totalRecovered" ,async (req,res) => {
    try {
        const result = await connection.aggregate([
          {
            $group: {
              _id: 'total',
              recovered: { $sum: '$recovered' }
            }
          }
        ]);
        
        res.json({ data: result[0] });
      } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
      }
    });
app.get("/totalActive", async (req,res) => {
    try{
        const result = await connection.aggregate([
            {$group : {
                _id:'total',
                active : {$sum :{$subtract : ['$infected' , '$recovered']} }
            }}
        ])
        res.json({data : result[0]})
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
      }
    });

    app.get("/totalDeath" ,async (req,res) => {
        try {
            const result = await connection.aggregate([
              {
                $group: {
                  _id: 'total',
                  death: { $sum: '$death' }
                }
              }
            ]);
            
            res.json({ data: result[0] });
          } catch (err) {
            console.error(err);
            res.status(500).send('Server error');
          }
        });
        app.get('/hotspotStates', async (req, res) => {
            try {
              const hotspotStates = await connection.aggregate([
                {
                  $project: {
                    _id: 0,
                    state: 1,
                    rate: {
                      $round: [{ $divide: [{ $subtract: ['$infected', '$recovered'] }, '$infected'] }, 5]
                    }
                  }
                },
                {
                  $match: {
                    rate: { $gt: 0.1 }
                  }
                }
              ]);
              res.json({ data: hotspotStates });
            } catch (error) {
              console.error(error);
              res.status(500).send('Server Error');
            }
          });
          
          // Endpoint to get the healthy states
          app.get('/healthyStates', async (req, res) => {
            try {
              const healthyStates = await connection.aggregate([
                {
                  $project: {
                    _id: 0,
                    state: 1,
                    mortality: {
                      $round: [{ $divide: ['$death', '$infected'] }, 5]
                    }
                  }
                },
                {
                  $match: {
                    mortality: { $lt: 0.005 }
                  }
                }
              ]);
              res.json({ data: healthyStates });
            } catch (error) {
              console.error(error);
              res.status(500).send('Server Error');
            }
          });
          
        

app.listen(port, () => console.log(`App listening on port ${port}!`))

module.exports = app;