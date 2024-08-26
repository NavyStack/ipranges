// src/main.ts
import awsMain from './aws/processor'
import betterstackMain from './betterstack/processor'
import bingbotMain from './bingbot/processor'
import cloudflareMain from './cloudflare/processor'
import digitaloceanMain from './digitalocean/processor'
import githubMain from './github/processor'
import googleMain from './google/processor'
import googlebotMain from './googlebot/processor'
import microsoftAzureMain from './microsoft-azure/processor'
import oracleMain from './oracle/processor'
import vultrMain from './vultr/processor'
import linodeMain from './linode/processor'

const runAllProcessors = async () => {
  try {
    await Promise.all([
      linodeMain(),
      awsMain(),
      betterstackMain(),
      bingbotMain(),
      cloudflareMain(),
      digitaloceanMain(),
      githubMain(),
      googleMain(),
      googlebotMain(),
      microsoftAzureMain(),
      oracleMain(),
      vultrMain()
    ])

    console.log('All IP address processors completed successfully.')
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  }
}

runAllProcessors()
