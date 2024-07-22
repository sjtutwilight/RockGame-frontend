import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';

// Replace these with your contract's ABI and address
const contractAddress = '0x67d269191c92Caf3cD7723F116c85e6E9bf55933';
const contractABI = [{"type":"function","name":"createGame","inputs":[{"name":"choiceHash","type":"bytes32","internalType":"bytes32"}],"outputs":[],"stateMutability":"payable"},{"type":"function","name":"gameCounter","inputs":[],"outputs":[{"name":"","type":"uint256","internalType":"uint256"}],"stateMutability":"view"},{"type":"function","name":"games","inputs":[{"name":"","type":"uint256","internalType":"uint256"}],"outputs":[{"name":"banker","type":"address","internalType":"address payable"},{"name":"player","type":"address","internalType":"address payable"},{"name":"stake","type":"uint256","internalType":"uint256"},{"name":"bankerChoiceHash","type":"bytes32","internalType":"bytes32"},{"name":"bankerChoice","type":"uint8","internalType":"enum RockPaperScissors.Choice"},{"name":"playerChoice","type":"uint8","internalType":"enum RockPaperScissors.Choice"},{"name":"status","type":"uint8","internalType":"enum RockPaperScissors.GameStatus"},{"name":"winner","type":"address","internalType":"address payable"}],"stateMutability":"view"},{"type":"function","name":"getActiveGames","inputs":[],"outputs":[{"name":"","type":"tuple[]","internalType":"struct RockPaperScissors.Game[]","components":[{"name":"banker","type":"address","internalType":"address payable"},{"name":"player","type":"address","internalType":"address payable"},{"name":"stake","type":"uint256","internalType":"uint256"},{"name":"bankerChoiceHash","type":"bytes32","internalType":"bytes32"},{"name":"bankerChoice","type":"uint8","internalType":"enum RockPaperScissors.Choice"},{"name":"playerChoice","type":"uint8","internalType":"enum RockPaperScissors.Choice"},{"name":"status","type":"uint8","internalType":"enum RockPaperScissors.GameStatus"},{"name":"winner","type":"address","internalType":"address payable"}]}],"stateMutability":"view"},{"type":"function","name":"joinGame","inputs":[{"name":"gameId","type":"uint256","internalType":"uint256"},{"name":"playerChoice","type":"uint8","internalType":"enum RockPaperScissors.Choice"}],"outputs":[],"stateMutability":"payable"},{"type":"function","name":"revealChoice","inputs":[{"name":"gameId","type":"uint256","internalType":"uint256"},{"name":"bankerChoice","type":"uint8","internalType":"enum RockPaperScissors.Choice"},{"name":"secret","type":"string","internalType":"string"}],"outputs":[],"stateMutability":"nonpayable"},{"type":"function","name":"withdrawFunds","inputs":[{"name":"gameId","type":"uint256","internalType":"uint256"}],"outputs":[],"stateMutability":"nonpayable"},{"type":"event","name":"ChoiceRevealed","inputs":[{"name":"gameId","type":"uint256","indexed":false,"internalType":"uint256"},{"name":"banker","type":"address","indexed":false,"internalType":"address"},{"name":"choice","type":"uint8","indexed":false,"internalType":"enum RockPaperScissors.Choice"}],"anonymous":false},{"type":"event","name":"GameCreated","inputs":[{"name":"gameId","type":"uint256","indexed":false,"internalType":"uint256"},{"name":"banker","type":"address","indexed":false,"internalType":"address"},{"name":"stake","type":"uint256","indexed":false,"internalType":"uint256"}],"anonymous":false},{"type":"event","name":"GameFinished","inputs":[{"name":"gameId","type":"uint256","indexed":false,"internalType":"uint256"},{"name":"winner","type":"address","indexed":false,"internalType":"address"},{"name":"amount","type":"uint256","indexed":false,"internalType":"uint256"}],"anonymous":false},{"type":"event","name":"GameJoined","inputs":[{"name":"gameId","type":"uint256","indexed":false,"internalType":"uint256"},{"name":"player","type":"address","indexed":false,"internalType":"address"}],"anonymous":false}]
function LocalApp() {
  const [account, setAccount] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [signer, setSigner] = useState(null);
  const [contract, setContract] = useState(null);
  const [choiceHash, setChoiceHash] = useState('');
  const [betAmount, setBetAmount] = useState('');
const [games, setGames] = useState([]);
const [selectedAccount, setSelectedAccount] = useState('');
const [events, setEvents] = useState([]); // State to store event logs

const [selectedChoices, setSelectedChoices] = useState({});
const [revealSecrets, setRevealSecrets] = useState({});
const [revealChoices, setRevealChoices] = useState({});
const [generateChoice, setGenerateChoice] = useState('');
const [generateSecret, setGenerateSecret] = useState('');
  useEffect(() => {
    async function connectWallet() {
      if (window.ethereum) {
        try {
      const provider = new ethers.providers.JsonRpcProvider('http://localhost:8545');
          const accounts = await provider.listAccounts();
          
          setAccounts(accounts.slice(0,2));
          const defaultSigner = provider.getSigner(accounts[0]);
          setSigner(defaultSigner);
          setAccount(accounts[0]);
          const contract = new ethers.Contract(contractAddress, contractABI, defaultSigner);
          setContract(contract);
          fetchGames(contract);
        } catch (error) {
          console.error("Error connecting to wallet:", error);
        }
      } else {
        console.error("No Ethereum provider found. Install MetaMask.");
      }
    }
    connectWallet();
  }, []);
  const listenForEvents = (contract) => {
    contract.on('GameCreated', (gameId, banker, stake, event) => {
      console.log('GameCreated:', { gameId, banker, stake, event });
      setEvents((prevEvents) => [...prevEvents, { event: 'GameCreated', data: { gameId, banker, stake }, transactionHash: event.transactionHash }]);
    });

    contract.on('GameJoined', (gameId, player, event) => {
      console.log('GameJoined:', { gameId, player, event });
      setEvents((prevEvents) => [...prevEvents, { event: 'GameJoined', data: { gameId, player }, transactionHash: event.transactionHash }]);
    });

    contract.on('ChoiceRevealed', (gameId, banker, choice, event) => {
      console.log('ChoiceRevealed:', { gameId, banker, choice, event });
      setEvents((prevEvents) => [...prevEvents, { event: 'ChoiceRevealed', data: { gameId, banker, choice }, transactionHash: event.transactionHash }]);
    });

    contract.on('GameFinished', (gameId, winner, amount, event) => {
      console.log('GameFinished:', { gameId, winner, amount, event });
      setEvents((prevEvents) => [...prevEvents, { event: 'GameFinished', data: { gameId, winner, amount }, transactionHash: event.transactionHash }]);
    });

    // Clean up event listeners when component unmounts
    return () => {
      contract.removeAllListeners('GameCreated');
      contract.removeAllListeners('GameJoined');
      contract.removeAllListeners('ChoiceRevealed');
      contract.removeAllListeners('GameFinished');
    };
  };

  const generateChoiceHash = (choice, secret) => {
    const choiceMap = {
      Rock: 1,
      Paper: 2,
      Scissors: 3
    };

    // Generate the keccak256 hash
    const hash = ethers.utils.keccak256(
      ethers.utils.defaultAbiCoder.encode(
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
      console.log(ethers.utils.parseEther(betAmount));
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
      const tx = await contract.joinGame(id, choice, { value: ethers.utils.parseEther(stake),gasLimit: 3000000});
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
        const hash = ethers.utils.keccak256(
            ethers.utils.defaultAbiCoder.encode(
              ['uint8', 'string'],
              [revealChoices[id], revealSecrets[id]]
            )
          );
          console.log(id+":"+hash);
          console.log(games);
      const tx = await contract.revealChoice(id, revealChoices[id], revealSecrets[id],{gasLimit: 3000000});
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
  const switchSigner = (event) => {
    const account = event.target.value;
    try {
      setSelectedAccount(account);

      const provider = new ethers.providers.JsonRpcProvider('http://localhost:8545');
      const newSigner = provider.getSigner(account);
      setSigner(newSigner);
      setAccount(account);
      const contract = new ethers.Contract(contractAddress, contractABI, newSigner);
      setContract(contract);
      fetchGames(contract);
    } catch (error) {
      console.error("Error switching signer:", error);
    }
  }
  const handleChoiceChange = (gameId, event) => {
    const newChoices = { ...selectedChoices, [gameId]: event.target.value };
    setSelectedChoices(newChoices);
  };
  const handleRevealChoiceChange = (gameId, event) => {
    const newChoices = { ...revealChoices, [gameId]: event.target.value };
    setRevealChoices(newChoices);
  };
  const handleRevealSecretChange = (gameId, event) => {
    const newChoices = { ...revealSecrets, [gameId]: event.target.value };
    setRevealSecrets(newChoices);
  };
  return (
    <div>
      <h1>Rock Paper Scissors DApp</h1>
      {account ? <p>Connected as: {account}</p> : <p>Not connected</p>}
      <div>
        <h2>Select Account</h2>
        <select value={selectedAccount} onChange={switchSigner}>
          <option value="" disabled>Select account</option>
          {accounts.map((acc, index) => (
            <option key={index} value={acc}>{acc}</option>
          ))}
        </select>
      </div>
      <div>
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
        Game ID: {index+1} - Bet Amount: 
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

                value={revealSecrets[index+1]??''}
                onChange={(e) => handleRevealSecretChange(index + 1, e)}
              />
              <select onChange={(e) => handleRevealChoiceChange(index + 1, e)}>
                <option value="">Select Reveal Choice</option>
                <option value="1">Rock</option>
                <option value="2">Paper</option>
                <option value="3">Scissors</option>
              </select>
              <button onClick={() => revealChoiceInGame(index + 1)}>
                Reveal Choice
              </button>
      <button onClick={() => withdrawFunds(index+1)}>Withdraw Funds</button>
    </li>
  ))}
</ul>

      </div>
    </div>
  );
}

export default LocalApp;