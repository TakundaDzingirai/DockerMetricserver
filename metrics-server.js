const express = require('express');
const client = require('prom-client');
const { Sequelize, DataTypes } = require('sequelize');

const app = express();
const port = process.env.PORT || 3001; // Use the environment variable PORT if set, otherwise default to 3001
const host = '0.0.0.0'; // Listen on all network interfaces

// Middleware to parse JSON bodies
app.use(express.json());

// Create a Registry to register the metrics
const register = new client.Registry();

// Setup SQLite database with Sequelize
const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: 'metrics.sqlite' // This is the file where the database will be stored
});

// Define a model for Feature Usage
const FeatureUsage = sequelize.define('FeatureUsage', {
    feature: {
        type: DataTypes.STRING,
        primaryKey: true
    },
    count: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    }
});

// Define a model for App Downloads
const AppDownload = sequelize.define('AppDownload', {
    app: {
        type: DataTypes.STRING,
        primaryKey: true
    },
    count: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    }
});

// Sync database
sequelize.sync();

// Define metrics
const featureUsageCounter = new client.Counter({
    name: 'feature_usage_count',
    help: 'Count of feature usage',
    labelNames: ['feature'],
});

const appDownloadCounter = new client.Counter({
    name: 'app_download_count',
    help: 'Count of app downloads',
    labelNames: ['app'],
});

// Register the metrics
register.registerMetric(featureUsageCounter);
register.registerMetric(appDownloadCounter);

// Initialize metrics with values from the database or set to zero
async function initializeMetrics() {
    const features = await FeatureUsage.findAll();
    const apps = await AppDownload.findAll();

    // Initialize feature usage counters
    if (features.length === 0) {
        featureUsageCounter.labels('AppStore').inc(0);
    } else {
        features.forEach(feature => {
            featureUsageCounter.labels(feature.feature).inc(feature.count);
        });
    }

    // Initialize app download counters
    if (apps.length === 0) {
        appDownloadCounter.labels('OVibrations radio station').inc(0);
    } else {
        apps.forEach(app => {
            appDownloadCounter.labels(app.app).inc(app.count);
        });
    }
}

// Metrics endpoint
app.get('/metrics', async (req, res) => {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
});

// Endpoint to increment the feature usage counter
app.post('/use-feature', async (req, res) => {
    const feature = req.body.feature;
    featureUsageCounter.labels(feature).inc();

    // Update database
    const [record, created] = await FeatureUsage.findOrCreate({
        where: { feature },
        defaults: { count: 1 }
    });
    if (!created) {
        record.count += 1;
        await record.save();
    }

    res.send('Feature usage recorded');
});

// Endpoint to increment the app download counter
app.post('/download-app', async (req, res) => {
    const appName = req.body.app;
    appDownloadCounter.labels(appName).inc();

    // Update database
    const [record, created] = await AppDownload.findOrCreate({
        where: { app: appName },
        defaults: { count: 1 }
    });
    if (!created) {
        record.count += 1;
        await record.save();
    }

    res.send('App download recorded');
});

// Endpoint to clear all data in the database
app.post('/clear-database', async (req, res) => {
    try {
        await FeatureUsage.destroy({ where: {}, truncate: true });
        await AppDownload.destroy({ where: {}, truncate: true });

        // Reset the counters
        featureUsageCounter.reset();
        appDownloadCounter.reset();

        res.send({ message: 'Database cleared successfully.' });
    } catch (error) {
        console.error('Error clearing database:', error);
        res.status(500).send({ message: 'Error clearing database.', error });
    }
});

// Start the server and initialize metrics
app.listen(port, host, async () => {
    await initializeMetrics();
    console.log(`Metrics server listening at http://${host}:${port}`);
});
