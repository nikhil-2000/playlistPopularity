import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';
import queryString from 'query-string';
import request from 'request';


let defaultTextColor = '#1DB954';
let defaultStyle = {
  color: defaultTextColor
};

let counterStyle = {...defaultStyle,width: "40%", 
display: 'inline-block',
'margin-bottom': '10px',
'font-size': '14px',
'line-height': '30px'}


class PlaylistCounter extends Component{
  render () {
    let playlistCounterStyle = {...counterStyle}
    return (
      <div style = {playlistCounterStyle}>
        <h2>
          {this.props.playlists && this.props.playlists.length} Playlists
        </h2>
      </div>
    );
  }
}

class HoursCounter extends Component{
  render () {

    let allSongs = this.props.playlists.reduce((songs,eachPlaylist) => {
      return songs.concat(eachPlaylist.songs)
    }, [])
    let totalDuration = allSongs.reduce((time,eachSong) => {
      return time + eachSong.duration
    }, 0)
    let hoursCounterStyle = {...counterStyle}
    return (
      <div style = {hoursCounterStyle}>
        <h2>
          {Math.round(totalDuration / 60)} Hours
        </h2>
      </div>
    );
  }
}

class Filter extends Component {
  render () {
    let onTextChange = this.props.onTextChange
    let filterStyle = {...defaultStyle,color:defaultTextColor,'background-color':'black',padding:'10px','font-size':'20px'}
    return (
      <div>
        <img/>
        <input type = "text" style = {filterStyle} onChange = {event => onTextChange(event.target.value)}/>
      </div>
    );
  }
}

class Playlist extends Component {
  render() {
    let playlistStyle = {...defaultStyle,
      width:"30%",
      display: 'inline-block',
      padding: '10px',
      align: 'center'
    };
    return (
      <div style = {playlistStyle}>
        <img src = {this.props.playlist.image} style = {{width: '50%'}} />
        <h3 style = {{'font-size':'30px',fontWeight:'bold '}}><b>{this.props.playlist.name}</b></h3>
        <table style = {{'font-size':'20px',width: '50%'}}>
          {this.props.playlist.songs.map( song =>
            (<tr><td>{song.name}</td><td style = {{padding: '10px'}}>{song.artist}</td></tr>)
          )}
        </table>
      </div>
    );
  }
}


class App extends Component {
  constructor() {
    super()
    this.state = {
      serverData :{},
      filterString: ''
    }
  }
  componentDidMount() {
    let parsed = queryString.parse(window.location.search);
    let accessToken = parsed.access_token
    if (!accessToken)
      return;


    fetch('https://api.spotify.com/v1/me', {
      headers: {'Authorization': 'Bearer ' + accessToken}
    }).then(response => response.json())
    .then(data => this.setState({
      user: {
        name: data.display_name
      }
    }))

    fetch('https://api.spotify.com/v1/me/playlists', {
      headers: {'Authorization': 'Bearer ' + accessToken}
    }).then(response => response.json())
    .then(playlistData => {
      let playlists = playlistData.items
      let trackDataPromises = playlists.map(playlist => {
        let responsePromise = fetch(playlist.tracks.href, {
          headers: {'Authorization': 'Bearer ' + accessToken}
        })
        let trackDataPromise = responsePromise.then(response => response.json())
        return trackDataPromise
      })
      let allTracksDataPromises = Promise.all(trackDataPromises)
      let playlistsPromise =  allTracksDataPromises.then(trackDatas => {
        trackDatas.forEach((trackData,i) => {
          playlists[i].trackDatas = trackData.items
          .map(item => item.track)
          .map(trackData => ({
            name:trackData.name,
            duration: trackData.duration_ms/1000,
            artist: trackData.artists[0].name
          }))
        })
        return playlists
      })
      return playlistsPromise
    })
    .then(playlists => this.setState({
      playlists: playlists.map(item => {
        console.log(item.trackDatas.artist)
        return {
          name : item.name,
          image : item.images[0].url,
          songs: item.trackDatas.slice(0,3)
        }
      })      
    }))


  }
  
  render() {
    let playlistsToRender = 
      this.state.user && 
      this.state.playlists 
        ? this.state.playlists.filter(playlist => {
            let matchesPlaylist = playlist.name.toLowerCase().includes(
              this.state.filterString.toLowerCase())
            let matchesSong = playlist.songs.find(song => song.name.toLowerCase()
              .includes(this.state.filterString.toLowerCase()))
            return matchesPlaylist || matchesSong
          })
        : []
    return (
      <div className="App">
        {this.state.user ?
        <div>

          <h1 style = {{...defaultStyle, 
            'font-size':'54px',
            'margin-top':'5px'

          }}>
            {this.state.user.name}'s Playlists
          </h1>
            <PlaylistCounter playlists = {playlistsToRender} />
            <HoursCounter playlists = {playlistsToRender}/>

          <Filter onTextChange = {text => this.setState({filterString: text})}/>
          {playlistsToRender.map(playlist =>
           <Playlist playlist = {playlist} />
          )}


        </div> : <button onClick = {() => 
          window.location = window.location.href.includes('localhost') 
          ? 'http:localhost:8888/login'
          : 'https://my-playlist-search-backend.herokuapp.com/login'

        }
        style = {{'border-radius': '25%','background-color': defaultTextColor,color: 'white',
                   padding : '20px', 'font-size': '50px', 'margin-top': '20px'}}>
          Sign in with Spotify
          </button>
        }

      </div>
    );
  }
}

export default App;

// 

// https://better-playlists-spotifyapi.herokuapp.com/