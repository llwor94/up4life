import React, { useState } from 'react';
import { Query } from 'react-apollo';
import gql from 'graphql-tag';
import Chats from './Chats';

const ALL_CHATS_QUERY = gql`
	query {
		getUserChats {
			id
			users {
				id
				firstName
				img {
					id
					img_url
					default
				}
			}
			messages {
				id
				text
				seen
				createdAt
				from {
					id
					firstName
					img {
						id
						img_url
						default
					}
				}
				updatedAt
			}
		}
	}
`;

const MY_CHAT_SUBSCRIPTION = gql`
	subscription($id: String!) {
		myChat(id: $id) {
			mutation
			node {
				id
				users {
					id
					firstName
					img {
						id
						img_url
						default
					}
				}
				messages {
					id
					text
					seen
					createdAt
					from {
						id
						firstName
						img {
							id
							img_url
							default
						}
					}
					updatedAt
				}
			}
		}
	}
`;

const MY_MESSAGE_SUBSCRIPTION = gql`
	subscription($id: String!) {
		myMessages(id: $id) {
			mutation
			node {
				chat {
					id
				}
				id
				text
				seen
				createdAt
				from {
					id
					firstName
					img {
						id
						img_url
						default
					}
				}
				updatedAt
			}
		}
	}
`;

export default ({ user }) => {
	return (
		<Query query={ALL_CHATS_QUERY}>
			{({ loading, error, data, subscribeToMore }) => {
				if (loading || !data.getUserChats) return <div>Fetching</div>;
				if (error) return <div>Error</div>;

				return (
					<Chats
						data={data}
						currentUser={user}
						subscribeToNewChats={() => {
							subscribeToMore({
								document: MY_CHAT_SUBSCRIPTION,
								variables: {
									id: user.id,
								},
								updateQuery: (prev, { subscriptionData }) => {
									if (!subscriptionData) return prev;
									if (subscriptionData.data.myChat.mutation === 'UPDATED')
										return prev;
									const newNode = [
										...prev.getUserChats,
										subscriptionData.data.myChat.node,
									];
									return { getUserChats: newNode };
								},
							});
						}}
						subscribetoNewMessages={() => {
							subscribeToMore({
								document: MY_MESSAGE_SUBSCRIPTION,
								variables: {
									id: user.id,
								},
								updateQuery: (prev, { subscriptionData }) => {
									if (!subscriptionData) return prev;

									const convos = prev.getUserChats.find(
										chat =>
											chat.id ===
											subscriptionData.data.myMessages.node.chat.id,
									);

									const doubleMessage = convos.messages.find(
										message =>
											message.id === subscriptionData.data.myMessages.node.id,
									);

									if (doubleMessage) return prev;

									const newMessage = { ...subscriptionData.data.myMessages.node };

									return {
										getUserChats: prev.getUserChats.map(chat => {
											if (chat.id === newMessage.chat.id) {
												return {
													...chat,
													messages: [ ...chat.messages, newMessage ],
												};
											}
											return chat;
										}),
									};
								},
							});
						}}
					/>
				);
			}}
		</Query>
	);
};
