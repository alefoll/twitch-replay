import React from "react";

import { Calendar } from "@components/Calendar";
import { VideoApiModel, VideoModel, Video } from "@components/Video";
import { User, UserModel } from "@components/User";

import "./style.css";

export interface AppState {
    token: string | undefined,

    me: UserModel,
    users: UserModel[];
}

interface UserFollow {
    followed_at: string;
    from_id: string;
    from_name: string;
    to_id: string;
    to_name: string;
}

export class App extends React.PureComponent<{}, AppState> {
    private clientID = "gvmbg22kqruvfibmxm4dm5datn9yis";

    constructor(props: {}) {
        super(props);

        let token = window.localStorage.getItem("token");

        if (window.location.hash.length) {
            const hash = window.location.hash.slice(1);

            const hashParsed = hash.split("&").reduce((previous: any, current) => {
                const key = current.split("=")[0];
                const value = current.split("=")[1];

                previous[key] = value;

                return previous;
            }, {});

            if (hashParsed.access_token != null) {
                token = hashParsed.access_token;

                window.localStorage.setItem("token", hashParsed.access_token);
            }

            window.location.hash = "";
        }

        if (token) {
            this.state = {
                ...this.state,
                token: token
            };

            this.init();
        }
    }

    private api = async (path: string) => {
        try {
            const request = await fetch(`https://api.twitch.tv/helix/${ path }`, {
                headers: {
                    "Authorization" : `Bearer ${ this.state.token }`,
                    "Client-Id"     : this.clientID,
                }
            });

            if (!request.ok) {
                throw new Error("Token error");
            }

            return request.json();
        } catch(error) {
            window.localStorage.removeItem("token");

            this.setState({
                token: undefined
            });
        }
    }

    private readonly init = async () => {
        const me = (await this.getUsers())[0];

        this.setState({ me });

        const userFollow = await this.getUserChannels(me);

        const userIDs = userFollow.map(follow => follow.to_id);

        const users = await this.getUsers(userIDs);

        this.setState({ users });

        // users.map(async (user) => {
        //     const { videos, pagination: video_pagination } = await this.getVideos(user);

        //     const stateUsers = [...this.state.users];

        //     const stateUser = stateUsers.find(stateUser => stateUser.id === user.id);

        //     if (stateUser) {
        //         stateUser.videos = videos;
        //         stateUser.video_pagination = video_pagination;

        //         this.setState({ users: stateUsers });
        //     }
        // });
    }

    private readonly getVideosTruc = async(user: UserModel) => {
        const { videos, pagination: video_pagination } = await this.getVideos(user);

        const stateUsers = [...this.state.users];

        const stateUser = stateUsers.find(stateUser => stateUser.id === user.id);

        if (stateUser) {
            stateUser.videos = videos;
            stateUser.video_pagination = video_pagination;

            this.setState({ users: stateUsers });
        }
    }

    private readonly getToken = () => {
        window.location.assign(`https://id.twitch.tv/oauth2/authorize?client_id=${ this.clientID }&redirect_uri=https://alefoll.github.io/twitch-replay/&response_type=token`);

    }

    private readonly getUsers = async (userIDs: string[] = []): Promise<UserModel[]> => {
        let query = "";

        if (userIDs.length > 0 && userIDs.length < 100) { // API limit 100
            query = "?id=" + userIDs.join("&id=");
        }

        const request = await this.api(`users${ query }`);

        // console.log("getUsers", request.data);

        return request.data;
    }

    private readonly getUserChannels = async (user: UserModel, pagination: string = ""): Promise<UserFollow[]> => {
        const request = await this.api(`users/follows?from_id=${ user.id }&after=${ pagination }`);

        const result = request.data;

        // console.log("getUserChannels", result);

        if (request.pagination.cursor) {
            const recursive = await this.getUserChannels(user, request.pagination.cursor);

            result.push(...recursive);
        }

        return result;
    }

    private readonly getVideos = async (user: UserModel, pagination: string = ""): Promise<{ videos: VideoModel[], pagination: string }> => {
        const request = await this.api(`videos?user_id=${ user.id }`);

        // console.log("getVideos", request.data);

        let videos = request.data;

        videos = videos.filter((video: VideoApiModel) => video.thumbnail_url !== "" && video.type === "archive");

        videos = videos.map((video: VideoApiModel): VideoModel => {
            const startInSeconds = Video.dateToSeconds(video.created_at);
            const endInSeconds = startInSeconds + Video.durationToSeconds(video.duration);

            return {
                ...video,
                startInSeconds,
                endInSeconds
            }
        });

        return {
            videos: videos,
            pagination: request.pagination,
        };
    }

    render() {
        return (
            <>
                <h1>Twitch Replay Calendar</h1>

                <button onClick={ this.getToken }>Get a token</button><br/>

                { this.state?.token &&
                    <>
                        <div>{ this.state?.me?.display_name }</div>

                        <div className="user--list">
                            { this.state?.users?.map(user => <User key={ user.id } { ...user } getVideos={this.getVideosTruc} />) }
                        </div>

                        <Calendar users={ this.state?.users } />
                    </>
                }
            </>
        );
    }
}
