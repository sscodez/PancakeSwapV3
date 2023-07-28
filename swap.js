const hardhat = require("hardhat");

const smartRouterAbi = require('../abis/pancakeSmartRouter.json')
const smartRouterAddress = '0x13f4EA83D0bd40E75C8222255bc855a974568Dd4'

const factoryAbi = require('../abis/pancakeFactory.json')
const factoryAddress = '0x0BFbCF9fa4f9C56B0F40a671Ad40E0805A091865'

const wethAbi = require('../abis/weth.json')
const usdcAddress = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
const usdcAbi = require('../abis/erc20.json')
const wethAddress = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'


async function main() {
    const provider = hardhat.ethers.provider;

    const factoryContract = new hardhat.ethers.Contract(factoryAddress, factoryAbi, provider)

    const poolAddress = await factoryContract.getPool(wethAddress, usdcAddress, '500')
    console.log('poolAddress', poolAddress)

    const signerAddress = "0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B"
    const signer = await hardhat.ethers.getImpersonatedSigner(signerAddress);

    const wethContract = new hardhat.ethers.Contract(wethAddress, wethAbi, provider)
    const usdcContract = new hardhat.ethers.Contract(usdcAddress, usdcAbi, provider)

    const amountIn = hardhat.ethers.utils.parseUnits('1', '18')

    await wethContract.connect(signer).approve(smartRouterAddress, amountIn.toString())
    console.log('approved!')

    const smartRouterContract = new hardhat.ethers.Contract(smartRouterAddress, smartRouterAbi, provider)

    const params = {
        tokenIn: wethAddress,
        tokenOut: usdcAddress,
        fee: '500',
        recipient: signerAddress,
        deadline: Math.floor(Date.now() / 1000) + 60 * 10,
        amountIn,
        amountOutMinimum: 0,
        sqrtPriceLimitX96: 0,
    }

    let wethBalance
    let usdcBalance
    wethBalance = await wethContract.balanceOf(signerAddress)
    usdcBalance = await usdcContract.balanceOf(signerAddress)
    console.log('================= BEFORE SWAP')
    console.log('wethBalance:', hardhat.ethers.utils.formatUnits(wethBalance.toString(), 18))
    console.log('usdcBalance:', hardhat.ethers.utils.formatUnits(usdcBalance.toString(), 6))

    const tx = await smartRouterContract.connect(signer).exactInputSingle(
        params,
        {
            gasLimit: hardhat.ethers.utils.hexlify(1000000)
        }
    );
    await tx.wait()

    wethBalance = await wethContract.balanceOf(signerAddress)
    usdcBalance = await usdcContract.balanceOf(signerAddress)
    console.log('================= AFTER SWAP')
    console.log('wethBalance:', hardhat.ethers.utils.formatUnits(wethBalance.toString(), 18))
    console.log('usdcBalance:', hardhat.ethers.utils.formatUnits(usdcBalance.toString(), 6))
}

/*
node scripts/01_swap.js
*/

main()
