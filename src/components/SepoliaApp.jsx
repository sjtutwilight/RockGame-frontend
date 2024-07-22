import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';

const contractAddress = '0x7395D4d3fDfb6f10dd3fdcf8857A7c892e367e68'; // Replace with the deployed contract address on Sepolia
const contractABI = [{"type":"function","name":"createGame","inputs":[{"name":"choiceHash","type":"bytes32","internalType":"bytes32"}],"outputs":[],"stateMutability":"payable"},{"type":"function","name":"gameCounter","inputs":[],"outputs":[{"name":"","type":"uint256","internalType":"uint256"}],"stateMutability":"view"},{"type":"function","name":"games","inputs":[{"name":"","type":"uint256","internalType":"uint256"}],"outputs":[{"name":"banker","type":"address","internalType":"address payable"},{"name":"player","type":"address","internalType":"address payable"},{"name":"stake","type":"uint256","internalType":"uint256"},{"name":"bankerChoiceHash","type":"bytes32","internalType":"bytes32"},{"name":"bankerChoice","type":"uint8","internalType":"enum RockPaperScissors.Choice"},{"name":"playerChoice","type":"uint8","internalType":"enum RockPaperScissors.Choice"},{"name":"status","type":"uint8","internalType":"enum RockPaperScissors.GameStatus"},{"name":"winner","type":"address","internalType":"address payable"}],"stateMutability":"view"},{"type":"function","name":"getActiveGames","inputs":[],"outputs":[{"name":"","type":"tuple[]","internalType":"struct RockPaperScissors.Game[]","components":[{"name":"banker","type":"address","internalType":"address payable"},{"name":"player","type":"address","internalType":"address payable"},{"name":"stake","type":"uint256","internalType":"uint256"},{"name":"bankerChoiceHash","type":"bytes32","internalType":"bytes32"},{"name":"bankerChoice","type":"uint8","internalType":"enum RockPaperScissors.Choice"},{"name":"playerChoice","type":"uint8","internalType":"enum RockPaperScissors.Choice"},{"name":"status","type":"uint8","internalType":"enum RockPaperScissors.GameStatus"},{"name":"winner","type":"address","internalType":"address payable"}]}],"stateMutability":"view"},{"type":"function","name":"joinGame","inputs":[{"name":"gameId","type":"uint256","internalType":"uint256"},{"name":"playerChoice","type":"uint8","internalType":"enum RockPaperScissors.Choice"}],"outputs":[],"stateMutability":"payable"},{"type":"function","name":"revealChoice","inputs":[{"name":"gameId","type":"uint256","internalType":"uint256"},{"name":"bankerChoice","type":"uint8","internalType":"enum RockPaperScissors.Choice"},{"name":"secret","type":"string","internalType":"string"}],"outputs":[],"stateMutability":"nonpayable"},{"type":"function","name":"withdrawFunds","inputs":[{"name":"gameId","type":"uint256","internalType":"uint256"}],"outputs":[],"stateMutability":"nonpayable"},{"type":"event","name":"ChoiceRevealed","inputs":[{"name":"gameId","type":"uint256","indexed":false,"internalType":"uint256"},{"name":"banker","type":"address","indexed":false,"internalType":"address"},{"name":"choice","type":"uint8","indexed":false,"internalType":"enum RockPaperScissors.Choice"}],"anonymous":false},{"type":"event","name":"GameCreated","inputs":[{"name":"gameId","type":"uint256","indexed":false,"internalType":"uint256"},{"name":"banker","type":"address","indexed":false,"internalType":"address"},{"name":"stake","type":"uint256","indexed":false,"internalType":"uint256"}],"anonymous":false},{"type":"event","name":"GameFinished","inputs":[{"name":"gameId","type":"uint256","indexed":false,"internalType":"uint256"},{"name":"winner","type":"address","indexed":false,"internalType":"address"},{"name":"amount","type":"uint256","indexed":false,"internalType":"uint256"}],"anonymous":false},{"type":"event","name":"GameJoined","inputs":[{"name":"gameId","type":"uint256","indexed":false,"internalType":"uint256"},{"name":"player","type":"address","indexed":false,"internalType":"address"}],"anonymous":false}];


function SepoliaApp() {
  const [account, setAccount] = useState(null);
  const [signer, setSigner] = useState(null);
  const [contract, setContract] = useState(null);
  const [choiceHash, setChoiceHash] = useState('');
  const [betAmount, setBetAmount] = useState('');
  const [games, setGames] = useState([]);
  const [selectedChoices, setSelectedChoices] = useState({});
  const [revealSecret, setRevealSecret] = useState('');
  const [revealChoice, setRevealChoice] = useState('');
  const [generateChoice, setGenerateChoice] = useState('');
  const [generateSecret, setGenerateSecret] = useState('');

  useEffect(() => {
    async function connectWallet() {
      if (window.ethereum) {
        try {
          const provider = new ethers.providers.Web3Provider(window.ethereum);
          const accounts = await provider.send("eth_accounts", []);
          console.log(accounts);
          setAccount(accounts[0]);
          const signer = provider.getSigner();
          setSigner(signer);
          const contract = new ethers.Contract(contractAddress, contractABI, signer);
          setContract(contract);
          fetchGames(contract);
        } catch (error) {
          console.error("Error connecting to MetaMask:", error);
        }
      } else {
        console.error("MetaMask not found. Please install MetaMask.");
      }
    }
    connectWallet();
  }, []);

  const generateChoiceHash = (choice, secret) => {
    const choiceMap = {
      Rock: 1,
      Paper: 2,
      Scissors: 3
    };

    const hash = ethers.utils.keccak256(
      ethers.utils.solidityPack(
        ['uint8', 'string'],
        [choiceMap[choice], secret]
      )
    );

    setChoiceHash(hash);
  };

  const fetchGames = async (contract) => {
    try {
      const activeGames = await contract.getActiveGames();
      setGames(activeGames);
    } catch (error) {
      console.error("Error fetching games:", error);
    }
  };

  const createGame = async () => {
    if (!contract) return;
    try {
      const tx = await contract.createGame(choiceHash, { value: ethers.utils.parseEther(betAmount) });
      await tx.wait();
      console.log('Game created:', tx);
      fetchGames(contract);
    } catch (error) {
      console.error('Error creating game:', error);
    }
  };

  const joinGame = async (id, choice, stake) => {
    if (!contract) return;
    try {
      const tx = await contract.joinGame(id, choice, { value: ethers.utils.parseEther(stake) });
      await tx.wait();
      console.log('Joined game:', tx);
      fetchGames(contract);
    } catch (error) {
      console.error('Error joining game:', error);
    }
  };

  const revealChoiceInGame = async (id) => {
    if (!contract) return;
    try {
      const tx = await contract.revealChoice(id, revealChoice, revealSecret);
      await tx.wait();
      console.log('Choice revealed:', tx);
      fetchGames(contract);
    } catch (error) {
      console.error('Error revealing choice:', error);
    }
  };

  const withdrawFunds = async (id) => {
    if (!contract) return;
    try {
      const tx = await contract.withdrawFunds(id);
      await tx.wait();
      console.log('Funds withdrawn:', tx);
      fetchGames(contract);
    } catch (error) {
      console.error('Error withdrawing funds:', error);
    }
  };

  const switchAccount = async (accountIndex) => {
    if (window.ethereum) {
      try {
        console.log("11111111");
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const accounts = await provider.send("eth_accounts", []);
        console.log(accounts);
        const account = accounts[accountIndex];
        setAccount(account);
        const signer = provider.getSigner(accountIndex);
        setSigner(signer);
        const contract = new ethers.Contract(contractAddress, contractABI, signer);
        setContract(contract);
        fetchGames(contract);
      } catch (error) {
        console.error("Error switching accounts:", error);
      }
    }
  };

  return (
    <div>
      <h1>Rock Paper Scissors DApp (Sepolia)</h1>
      {account ? <p>Connected as: {account}</p> : <p>Not connected</p>}
      <div>
        <button onClick={() => switchAccount(0)}>Switch to Creator Account</button>
        <button onClick={() => switchAccount(1)}>Switch to Player Account</button>
      </div>
      <div>
        <h2>Generate Choice Hash</h2>
        <select value={generateChoice} onChange={(e) => setGenerateChoice(e.target.value)}>
          <option value="" disabled>Select Choice</option>
          <option value="Rock">Rock</option>
          <option value="Paper">Paper</option>
          <option value="Scissors">Scissors</option>
        </select>
        <input
          type="text"
          placeholder="Secret"
          value={generateSecret}
          onChange={(e) => setGenerateSecret(e.target.value)}
        />
        <button onClick={() => generateChoiceHash(generateChoice, generateSecret)}>Generate Hash</button>
        {choiceHash && <p>Choice Hash: {choiceHash}</p>}
      </div>
      <div>
        <h2>Create Game</h2>
        <input
          type="text"
          placeholder="Bet Amount (ETH)"
          value={betAmount}
          onChange={(e) => setBetAmount(e.target.value)}
        />
        <button onClick={createGame}>Create Game</button>
      </div>
      <div>
        <h2>Active Games</h2>
        <ul>
          {games.map((game, index) => (
            <li key={index}>
              <span>
                Game ID: {index + 1} - Bet Amount: 
                {game.stake && !game.stake.isZero() ? ethers.utils.formatEther(game.stake) : '0'} ETH
              </span>
              <select onChange={(e) => handleChoiceChange(index + 1, e)}>
                <option value="">Select Move</option>
                <option value="1">Rock</option>
                <option value="2">Paper</option>
                <option value="3">Scissors</option>
              </select>
              <button onClick={() => joinGame(index + 1, selectedChoices[index + 1], ethers.utils.formatEther(game.stake))}>
                Join Game
              </button>
              <input
                type="text"
                placeholder="Secret"
                value={revealSecret}
                onChange={(e) => setRevealSecret(e.target.value)}
              />
              <select onChange={(e) => setRevealChoice(e.target.value)}>
                <option value="">Select Reveal Choice</option>
                <option value="1">Rock</option>
                <option value="2">Paper</option>
                <option value="3">Scissors</option>
              </select>
              <button onClick={() => revealChoiceInGame(index + 1)}>
                Reveal Choice
              </button>
              <button onClick={() => withdrawFunds(index + 1)}>Withdraw Funds</button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default SepoliaApp;
