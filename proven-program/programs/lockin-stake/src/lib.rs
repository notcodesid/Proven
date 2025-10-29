#![allow(unexpected_cfgs)]

use anchor_lang::prelude::*;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};

declare_id!("2axKJmSNPkdAysQXjz7y2R2Tho58WbzLYgYcAsMgfMKc");

#[program]
pub mod lockin_stake {
    use super::*;

    pub fn create_challenge(
        ctx: Context<CreateChallenge>,
        challenge_id: String,
        stake_amount: u64,
        total_days: u32,
        threshold_bps: u16,
        platform_fee_bps: u16,
        start_ts: i64,
        oracle_signer: Pubkey,
    ) -> Result<()> {
        require!(stake_amount > 0, LockinError::InvalidAmount);
        require!(total_days > 0, LockinError::InvalidDuration);
        require!(threshold_bps <= 10000, LockinError::InvalidThreshold);
        require!(platform_fee_bps <= 1000, LockinError::InvalidFee);
        require!(
            start_ts > Clock::get()?.unix_timestamp,
            LockinError::InvalidStartTime
        );
        require!(!challenge_id.is_empty(), LockinError::ChallengeIdEmpty);
        require!(
            challenge_id.as_bytes().len() <= Challenge::MAX_ID_LENGTH,
            LockinError::ChallengeIdTooLong
        );

        let challenge = &mut ctx.accounts.challenge;
        challenge.challenge_id = challenge_id.clone();
        challenge.admin = ctx.accounts.admin.key();
        challenge.token_mint = ctx.accounts.token_mint.key();
        challenge.escrow_vault = ctx.accounts.escrow_vault.key();
        challenge.stake_amount = stake_amount;
        challenge.total_days = total_days;
        challenge.threshold_bps = threshold_bps;
        challenge.platform_fee_bps = platform_fee_bps;
        challenge.status = ChallengeStatus::Created;
        challenge.start_ts = start_ts;
        challenge.end_ts = start_ts + (total_days as i64 * 24 * 60 * 60);
        challenge.participant_count = 0;
        challenge.active_participants = 0;
        challenge.winner_count = 0;
        challenge.loser_count = 0;
        challenge.bonus_per_winner = 0;
        challenge.fee_amount = 0;
        challenge.remainder = 0;
        challenge.payouts_claimed_count = 0;
        challenge.remainder_claimed = 0;
        challenge.oracle_signer = oracle_signer;
        challenge.bump = ctx.bumps.challenge;

        emit!(ChallengeCreated {
            challenge_id: challenge.key(),
            admin: challenge.admin,
            stake_amount,
            total_days,
            start_ts,
        });

        Ok(())
    }

    pub fn join_challenge(ctx: Context<JoinChallenge>, challenge_id: String) -> Result<()> {
        let challenge = &mut ctx.accounts.challenge;
        let participant = &mut ctx.accounts.participant;
        let clock = Clock::get()?;

        require!(
            challenge.challenge_id == challenge_id,
            LockinError::ChallengeIdMismatch
        );
        require!(
            challenge.status == ChallengeStatus::Created,
            LockinError::InvalidChallengeStatus
        );
        require!(
            clock.unix_timestamp < challenge.start_ts,
            LockinError::ChallengeStarted
        );

        // Transfer USDC from user to escrow vault
        let cpi_accounts = Transfer {
            from: ctx.accounts.user_token_account.to_account_info(),
            to: ctx.accounts.escrow_vault.to_account_info(),
            authority: ctx.accounts.user.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        token::transfer(cpi_ctx, challenge.stake_amount)?;

        // Initialize participant
        participant.user = ctx.accounts.user.key();
        participant.challenge = challenge.key();
        participant.joined = true;
        participant.stake_deposited = challenge.stake_amount;
        participant.proof_days = 0;
        participant.is_winner = false;
        participant.is_settled = false;
        participant.payout_claimed = false;
        participant.refund_claimed = false;
        participant.bump = ctx.bumps.participant;

        // Update challenge stats
        challenge.participant_count += 1;
        challenge.active_participants = challenge
            .active_participants
            .checked_add(1)
            .ok_or(LockinError::MathOverflow)?;

        emit!(ChallengeJoined {
            challenge_id: challenge.key(),
            user: ctx.accounts.user.key(),
            stake_amount: challenge.stake_amount,
        });

        Ok(())
    }

    pub fn record_proof(ctx: Context<RecordProof>, challenge_id: String) -> Result<()> {
        let challenge = &mut ctx.accounts.challenge;
        let participant = &mut ctx.accounts.participant;
        let clock = Clock::get()?;

        require!(
            challenge.challenge_id == challenge_id,
            LockinError::ChallengeIdMismatch
        );
        require!(
            challenge.status == ChallengeStatus::Created
                || challenge.status == ChallengeStatus::Started,
            LockinError::InvalidChallengeStatus
        );
        require!(
            clock.unix_timestamp >= challenge.start_ts,
            LockinError::ChallengeNotStarted
        );
        require!(
            clock.unix_timestamp <= challenge.end_ts,
            LockinError::ChallengeEnded
        );
        require!(participant.joined, LockinError::NotJoined);
        require!(
            ctx.accounts.oracle.key() == challenge.oracle_signer,
            LockinError::InvalidOracle
        );

        if challenge.status == ChallengeStatus::Created {
            challenge.status = ChallengeStatus::Started;
        }

        // Increment proof days
        participant.proof_days += 1;

        emit!(ProofRecorded {
            challenge_id: challenge.key(),
            user: participant.user,
            proof_days: participant.proof_days,
        });

        Ok(())
    }

    pub fn settle_challenge(ctx: Context<SettleChallenge>, challenge_id: String) -> Result<()> {
        let challenge = &mut ctx.accounts.challenge;
        let clock = Clock::get()?;

        require!(
            challenge.challenge_id == challenge_id,
            LockinError::ChallengeIdMismatch
        );
        require!(
            challenge.status == ChallengeStatus::Created
                || challenge.status == ChallengeStatus::Started,
            LockinError::InvalidChallengeStatus
        );
        require!(
            clock.unix_timestamp > challenge.end_ts,
            LockinError::ChallengeNotEnded
        );
        require!(
            ctx.accounts.oracle.key() == challenge.oracle_signer,
            LockinError::InvalidOracle
        );

        // Calculate threshold days required
        let required_days = (challenge.total_days as u64 * challenge.threshold_bps as u64) / 10000;

        challenge.status = ChallengeStatus::Ended;

        emit!(ChallengeSettlementStarted {
            challenge_id: challenge.key(),
            required_days: required_days as u32,
        });

        Ok(())
    }

    pub fn settle_participant(ctx: Context<SettleParticipant>, challenge_id: String) -> Result<()> {
        let challenge = &mut ctx.accounts.challenge;
        let participant = &mut ctx.accounts.participant;

        require!(
            challenge.challenge_id == challenge_id,
            LockinError::ChallengeIdMismatch
        );
        require!(
            challenge.status == ChallengeStatus::Ended,
            LockinError::InvalidChallengeStatus
        );
        require!(
            ctx.accounts.oracle.key() == challenge.oracle_signer,
            LockinError::InvalidOracle
        );
        require!(!participant.is_settled, LockinError::AlreadySettled);

        // Calculate threshold days required
        let required_days = (challenge.total_days as u64 * challenge.threshold_bps as u64) / 10000;

        if participant.proof_days as u64 >= required_days {
            // User is a winner
            participant.is_winner = true;
            challenge.winner_count += 1;
        } else {
            // User is a loser
            challenge.loser_count += 1;
        }

        participant.is_settled = true;

        emit!(ParticipantSettled {
            challenge_id: challenge.key(),
            user: participant.user,
            is_winner: participant.is_winner,
            proof_days: participant.proof_days,
            required_days: required_days as u32,
        });

        Ok(())
    }

    pub fn finalize_settlement(
        ctx: Context<FinalizeSettlement>,
        challenge_id: String,
    ) -> Result<()> {
        let challenge = &mut ctx.accounts.challenge;

        require!(
            challenge.challenge_id == challenge_id,
            LockinError::ChallengeIdMismatch
        );
        require!(
            challenge.status == ChallengeStatus::Ended,
            LockinError::InvalidChallengeStatus
        );
        require!(
            ctx.accounts.oracle.key() == challenge.oracle_signer,
            LockinError::InvalidOracle
        );
        require!(
            challenge.winner_count + challenge.loser_count == challenge.participant_count,
            LockinError::SettlementIncomplete
        );

        // Calculate platform fees and distribution
        let losers_stakes = challenge.loser_count as u64 * challenge.stake_amount;
        let platform_fee = (losers_stakes * challenge.platform_fee_bps as u64) / 10000;
        let distributable_amount = losers_stakes - platform_fee;

        // Store platform fee and reset counters
        challenge.fee_amount = platform_fee;
        challenge.payouts_claimed_count = 0;
        challenge.remainder_claimed = 0;

        if challenge.winner_count > 0 {
            // Distribute remaining stakes equally among winners
            challenge.bonus_per_winner = distributable_amount / challenge.winner_count as u64;
            challenge.remainder = distributable_amount % challenge.winner_count as u64;
        } else {
            // No winners - all distributable stakes remain in escrow (edge case)
            challenge.bonus_per_winner = 0;
            challenge.remainder = distributable_amount;
            challenge.remainder_claimed = distributable_amount;
        }

        challenge.status = ChallengeStatus::Settled;

        emit!(ChallengeSettled {
            challenge_id: challenge.key(),
            winner_count: challenge.winner_count,
            loser_count: challenge.loser_count,
            bonus_per_winner: challenge.bonus_per_winner,
        });

        Ok(())
    }

    pub fn claim_payout(ctx: Context<ClaimPayout>, challenge_id: String) -> Result<()> {
        let challenge = &ctx.accounts.challenge;
        let participant = &mut ctx.accounts.participant;

        require!(
            challenge.challenge_id == challenge_id,
            LockinError::ChallengeIdMismatch
        );
        require!(
            challenge.status == ChallengeStatus::Settled,
            LockinError::ChallengeNotSettled
        );
        require!(participant.is_settled, LockinError::NotSettled);
        require!(participant.is_winner, LockinError::NotWinner);
        require!(
            !participant.payout_claimed,
            LockinError::PayoutAlreadyClaimed
        );
        require!(
            challenge.payouts_claimed_count < challenge.winner_count,
            LockinError::AllPayoutsClaimed
        );

        // Calculate total payout (original stake + bonus)
        let mut bonus = challenge.bonus_per_winner;
        let mut remainder_increment = 0;
        if challenge.remainder_claimed < challenge.remainder {
            bonus = bonus.checked_add(1).ok_or(LockinError::MathOverflow)?;
            remainder_increment = 1;
        }
        let payout_amount = challenge
            .stake_amount
            .checked_add(bonus)
            .ok_or(LockinError::MathOverflow)?;

        // Store values needed for CPI
        let challenge_id = challenge.challenge_id.clone();
        let admin = challenge.admin;
        let bump = challenge.bump;

        // Transfer tokens from escrow vault to user
        let seeds = &[
            b"challenge",
            challenge_id.as_bytes(),
            admin.as_ref(),
            &[bump],
        ];
        let signer = &[&seeds[..]];

        let cpi_accounts = Transfer {
            from: ctx.accounts.escrow_vault.to_account_info(),
            to: ctx.accounts.user_token_account.to_account_info(),
            authority: ctx.accounts.challenge.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);
        token::transfer(cpi_ctx, payout_amount)?;

        participant.payout_claimed = true;
        ctx.accounts.challenge.payouts_claimed_count = ctx
            .accounts
            .challenge
            .payouts_claimed_count
            .checked_add(1)
            .ok_or(LockinError::MathOverflow)?;
        ctx.accounts.challenge.remainder_claimed = ctx
            .accounts
            .challenge
            .remainder_claimed
            .checked_add(remainder_increment)
            .ok_or(LockinError::MathOverflow)?;

        emit!(PayoutClaimed {
            challenge_id: ctx.accounts.challenge.key(),
            user: participant.user,
            amount: payout_amount,
        });

        Ok(())
    }

    pub fn cancel_challenge(ctx: Context<CancelChallenge>, challenge_id: String) -> Result<()> {
        let challenge = &mut ctx.accounts.challenge;
        let clock = Clock::get()?;

        require!(
            challenge.challenge_id == challenge_id,
            LockinError::ChallengeIdMismatch
        );
        require!(
            challenge.admin == ctx.accounts.admin.key(),
            LockinError::Unauthorized
        );
        require!(
            challenge.status == ChallengeStatus::Created,
            LockinError::InvalidChallengeStatus
        );
        require!(
            clock.unix_timestamp < challenge.start_ts,
            LockinError::ChallengeStarted
        );

        challenge.status = ChallengeStatus::Cancelled;

        emit!(ChallengeCancelled {
            challenge_id: challenge.key(),
            admin: challenge.admin,
        });

        Ok(())
    }

    pub fn claim_refund(ctx: Context<ClaimRefund>, challenge_id: String) -> Result<()> {
        let challenge = &ctx.accounts.challenge;
        let participant = &mut ctx.accounts.participant;

        require!(
            challenge.challenge_id == challenge_id,
            LockinError::ChallengeIdMismatch
        );
        require!(
            challenge.status == ChallengeStatus::Cancelled,
            LockinError::NotCancelled
        );
        require!(participant.joined, LockinError::NotJoined);
        require!(!participant.refund_claimed, LockinError::AlreadyClaimed);

        // Store values needed for CPI
        let challenge_id = challenge.challenge_id.clone();
        let admin = challenge.admin;
        let bump = challenge.bump;

        // Transfer stake back to user
        let seeds = &[
            b"challenge",
            challenge_id.as_bytes(),
            admin.as_ref(),
            &[bump],
        ];
        let signer = &[&seeds[..]];

        let cpi_accounts = Transfer {
            from: ctx.accounts.escrow_vault.to_account_info(),
            to: ctx.accounts.user_token_account.to_account_info(),
            authority: ctx.accounts.challenge.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);
        token::transfer(cpi_ctx, participant.stake_deposited)?;

        participant.refund_claimed = true;

        emit!(RefundClaimed {
            challenge_id: ctx.accounts.challenge.key(),
            user: participant.user,
            amount: participant.stake_deposited,
        });

        Ok(())
    }

    pub fn withdraw_fees(ctx: Context<WithdrawFees>, challenge_id: String) -> Result<()> {
        require!(
            ctx.accounts.challenge.challenge_id == challenge_id,
            LockinError::ChallengeIdMismatch
        );
        require!(
            ctx.accounts.challenge.admin == ctx.accounts.admin.key(),
            LockinError::Unauthorized
        );
        require!(
            ctx.accounts.challenge.status == ChallengeStatus::Settled
                || ctx.accounts.challenge.status == ChallengeStatus::Cancelled,
            LockinError::InvalidChallengeStatus
        );
        require!(ctx.accounts.challenge.fee_amount > 0, LockinError::NoFees);

        let fee_amount = ctx.accounts.challenge.fee_amount;
        let challenge_id_str = ctx.accounts.challenge.challenge_id.clone();
        let admin = ctx.accounts.challenge.admin;
        let bump = ctx.accounts.challenge.bump;
        let challenge_key = ctx.accounts.challenge.key();

        // Transfer fees from escrow vault to admin
        let seeds = &[
            b"challenge",
            challenge_id_str.as_bytes(),
            admin.as_ref(),
            &[bump],
        ];
        let signer = &[&seeds[..]];

        let cpi_accounts = Transfer {
            from: ctx.accounts.escrow_vault.to_account_info(),
            to: ctx.accounts.admin_token_account.to_account_info(),
            authority: ctx.accounts.challenge.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);
        token::transfer(cpi_ctx, fee_amount)?;

        ctx.accounts.challenge.fee_amount = 0;

        emit!(FeeWithdrawn {
            challenge_id: challenge_key,
            admin: admin,
            amount: fee_amount,
        });

        Ok(())
    }

    pub fn close_participant(ctx: Context<CloseParticipant>, challenge_id: String) -> Result<()> {
        let authority = &ctx.accounts.authority;
        let challenge = &mut ctx.accounts.challenge;
        let participant = &ctx.accounts.participant;
        let destination = &ctx.accounts.destination;

        require!(
            challenge.challenge_id == challenge_id,
            LockinError::ChallengeIdMismatch
        );
        require!(
            participant.user == destination.key(),
            LockinError::Unauthorized
        );
        require!(
            authority.key() == participant.user || authority.key() == challenge.admin,
            LockinError::Unauthorized
        );

        match challenge.status {
            ChallengeStatus::Settled => {
                require!(participant.is_settled, LockinError::NotSettled);
                if participant.is_winner {
                    require!(participant.payout_claimed, LockinError::PayoutNotClaimed);
                }
            }
            ChallengeStatus::Cancelled => {
                require!(participant.refund_claimed, LockinError::RefundNotClaimed);
            }
            _ => return err!(LockinError::ChallengeStillActive),
        }

        challenge.active_participants = challenge
            .active_participants
            .checked_sub(1)
            .ok_or(LockinError::MathOverflow)?;

        emit!(ParticipantClosed {
            challenge_id: challenge.key(),
            user: participant.user,
            closed_by: authority.key(),
        });

        Ok(())
    }

    pub fn close_challenge(ctx: Context<CloseChallenge>, challenge_id: String) -> Result<()> {
        let admin = &ctx.accounts.admin;
        let challenge = &mut ctx.accounts.challenge;

        require!(
            challenge.challenge_id == challenge_id,
            LockinError::ChallengeIdMismatch
        );
        require!(challenge.admin == admin.key(), LockinError::Unauthorized);

        match challenge.status {
            ChallengeStatus::Settled => {
                require!(
                    challenge.payouts_claimed_count == challenge.winner_count,
                    LockinError::PendingWinnerPayouts
                );
                require!(
                    challenge.remainder_claimed == challenge.remainder,
                    LockinError::PendingRemainderDistribution
                );
                require!(challenge.fee_amount == 0, LockinError::FeesUncollected);
            }
            ChallengeStatus::Cancelled => {
                require!(challenge.fee_amount == 0, LockinError::FeesUncollected);
            }
            _ => return err!(LockinError::ChallengeStillActive),
        }

        require!(
            challenge.active_participants == 0,
            LockinError::ParticipantsRemaining
        );

        emit!(ChallengeClosed {
            challenge_id: challenge.key(),
            admin: challenge.admin,
        });

        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(challenge_id: String)]
pub struct CreateChallenge<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,
    #[account(
        init,
        payer = admin,
        space = 8 + Challenge::LEN,
        seeds = [b"challenge", challenge_id.as_bytes(), admin.key().as_ref()],
        bump,
    )]
    pub challenge: Account<'info, Challenge>,
    pub token_mint: Account<'info, Mint>,
    #[account(
        init,
        payer = admin,
        associated_token::mint = token_mint,
        associated_token::authority = challenge,
    )]
    pub escrow_vault: Account<'info, TokenAccount>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
}

#[derive(Accounts)]
#[instruction(challenge_id: String)]
pub struct JoinChallenge<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    #[account(
        mut,
        seeds = [b"challenge", challenge_id.as_bytes(), challenge.admin.as_ref()],
        bump = challenge.bump,
    )]
    pub challenge: Account<'info, Challenge>,
    #[account(
        init,
        payer = user,
        space = 8 + Participant::LEN,
        seeds = [b"participant", challenge.key().as_ref(), user.key().as_ref()],
        bump,
    )]
    pub participant: Account<'info, Participant>,
    #[account(
        mut,
        associated_token::mint = challenge.token_mint,
        associated_token::authority = user,
    )]
    pub user_token_account: Account<'info, TokenAccount>,
    #[account(
        mut,
        associated_token::mint = challenge.token_mint,
        associated_token::authority = challenge,
    )]
    pub escrow_vault: Account<'info, TokenAccount>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
#[instruction(challenge_id: String)]
pub struct RecordProof<'info> {
    pub oracle: Signer<'info>,
    #[account(
        mut,
        seeds = [b"challenge", challenge_id.as_bytes(), challenge.admin.as_ref()],
        bump = challenge.bump,
    )]
    pub challenge: Account<'info, Challenge>,
    #[account(
        mut,
        seeds = [b"participant", challenge.key().as_ref(), participant.user.as_ref()],
        bump = participant.bump,
    )]
    pub participant: Account<'info, Participant>,
}

#[derive(Accounts)]
#[instruction(challenge_id: String)]
pub struct SettleChallenge<'info> {
    pub oracle: Signer<'info>,
    #[account(
        mut,
        seeds = [b"challenge", challenge_id.as_bytes(), challenge.admin.as_ref()],
        bump = challenge.bump,
    )]
    pub challenge: Account<'info, Challenge>,
}

#[derive(Accounts)]
#[instruction(challenge_id: String)]
pub struct SettleParticipant<'info> {
    pub oracle: Signer<'info>,
    #[account(
        mut,
        seeds = [b"challenge", challenge_id.as_bytes(), challenge.admin.as_ref()],
        bump = challenge.bump,
    )]
    pub challenge: Account<'info, Challenge>,
    #[account(
        mut,
        seeds = [b"participant", challenge.key().as_ref(), participant.user.as_ref()],
        bump = participant.bump,
    )]
    pub participant: Account<'info, Participant>,
}

#[derive(Accounts)]
#[instruction(challenge_id: String)]
pub struct FinalizeSettlement<'info> {
    pub oracle: Signer<'info>,
    #[account(
        mut,
        seeds = [b"challenge", challenge_id.as_bytes(), challenge.admin.as_ref()],
        bump = challenge.bump,
    )]
    pub challenge: Account<'info, Challenge>,
}

#[derive(Accounts)]
#[instruction(challenge_id: String)]
pub struct ClaimPayout<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    #[account(
        mut,
        seeds = [b"challenge", challenge_id.as_bytes(), challenge.admin.as_ref()],
        bump = challenge.bump,
    )]
    pub challenge: Account<'info, Challenge>,
    #[account(
        mut,
        seeds = [b"participant", challenge.key().as_ref(), user.key().as_ref()],
        bump = participant.bump,
    )]
    pub participant: Account<'info, Participant>,
    #[account(
        mut,
        associated_token::mint = challenge.token_mint,
        associated_token::authority = user,
    )]
    pub user_token_account: Account<'info, TokenAccount>,
    #[account(
        mut,
        associated_token::mint = challenge.token_mint,
        associated_token::authority = challenge,
    )]
    pub escrow_vault: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
#[instruction(challenge_id: String)]
pub struct CancelChallenge<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,
    #[account(
        mut,
        seeds = [b"challenge", challenge_id.as_bytes(), admin.key().as_ref()],
        bump = challenge.bump,
    )]
    pub challenge: Account<'info, Challenge>,
}

#[derive(Accounts)]
#[instruction(challenge_id: String)]
pub struct ClaimRefund<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    #[account(
        seeds = [b"challenge", challenge_id.as_bytes(), challenge.admin.as_ref()],
        bump = challenge.bump,
    )]
    pub challenge: Account<'info, Challenge>,
    #[account(
        mut,
        seeds = [b"participant", challenge.key().as_ref(), user.key().as_ref()],
        bump = participant.bump,
    )]
    pub participant: Account<'info, Participant>,
    #[account(
        mut,
        associated_token::mint = challenge.token_mint,
        associated_token::authority = user,
    )]
    pub user_token_account: Account<'info, TokenAccount>,
    #[account(
        mut,
        associated_token::mint = challenge.token_mint,
        associated_token::authority = challenge,
    )]
    pub escrow_vault: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
#[instruction(challenge_id: String)]
pub struct WithdrawFees<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,
    #[account(
        mut,
        seeds = [b"challenge", challenge_id.as_bytes(), admin.key().as_ref()],
        bump = challenge.bump,
    )]
    pub challenge: Account<'info, Challenge>,
    #[account(
        mut,
        associated_token::mint = challenge.token_mint,
        associated_token::authority = admin,
    )]
    pub admin_token_account: Account<'info, TokenAccount>,
    #[account(
        mut,
        associated_token::mint = challenge.token_mint,
        associated_token::authority = challenge,
    )]
    pub escrow_vault: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
#[instruction(challenge_id: String)]
pub struct CloseParticipant<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(
        mut,
        seeds = [b"challenge", challenge_id.as_bytes(), challenge.admin.as_ref()],
        bump = challenge.bump,
    )]
    pub challenge: Account<'info, Challenge>,
    #[account(
        mut,
        close = destination,
        seeds = [b"participant", challenge.key().as_ref(), participant.user.as_ref()],
        bump = participant.bump,
    )]
    pub participant: Account<'info, Participant>,
    /// CHECK: validated against participant.user in handler
    #[account(mut)]
    pub destination: UncheckedAccount<'info>,
}

#[derive(Accounts)]
#[instruction(challenge_id: String)]
pub struct CloseChallenge<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,
    #[account(
        mut,
        close = admin,
        seeds = [b"challenge", challenge_id.as_bytes(), admin.key().as_ref()],
        bump = challenge.bump,
    )]
    pub challenge: Account<'info, Challenge>,
}

#[account]
pub struct Challenge {
    pub challenge_id: String,
    pub admin: Pubkey,
    pub token_mint: Pubkey,
    pub escrow_vault: Pubkey,
    pub stake_amount: u64,
    pub total_days: u32,
    pub threshold_bps: u16,
    pub platform_fee_bps: u16,
    pub status: ChallengeStatus,
    pub start_ts: i64,
    pub end_ts: i64,
    pub participant_count: u32,
    pub active_participants: u32,
    pub winner_count: u32,
    pub loser_count: u32,
    pub bonus_per_winner: u64,
    pub fee_amount: u64,
    pub remainder: u64,
    pub payouts_claimed_count: u32,
    pub remainder_claimed: u64,
    pub oracle_signer: Pubkey,
    pub bump: u8,
}

impl Challenge {
    pub const MAX_ID_LENGTH: usize = 32;
    pub const LEN: usize = 4
        + Self::MAX_ID_LENGTH
        + 32
        + 32
        + 32
        + 8
        + 4
        + 2
        + 2
        + 1
        + 8
        + 8
        + 4
        + 4
        + 4
        + 4
        + 8
        + 8
        + 8
        + 4
        + 8
        + 32
        + 1; // 218 bytes
}

#[account]
pub struct Participant {
    pub user: Pubkey,
    pub challenge: Pubkey,
    pub joined: bool,
    pub stake_deposited: u64,
    pub proof_days: u32,
    pub is_winner: bool,
    pub is_settled: bool,
    pub payout_claimed: bool,
    pub refund_claimed: bool,
    pub bump: u8,
}

impl Participant {
    pub const LEN: usize = 32 + 32 + 1 + 8 + 4 + 1 + 1 + 1 + 1 + 1; // 82 bytes
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum ChallengeStatus {
    Created,
    Started,
    Ended,
    Settled,
    Cancelled,
}

// Events
#[event]
pub struct ChallengeCreated {
    pub challenge_id: Pubkey,
    pub admin: Pubkey,
    pub stake_amount: u64,
    pub total_days: u32,
    pub start_ts: i64,
}

#[event]
pub struct ChallengeJoined {
    pub challenge_id: Pubkey,
    pub user: Pubkey,
    pub stake_amount: u64,
}

#[event]
pub struct ProofRecorded {
    pub challenge_id: Pubkey,
    pub user: Pubkey,
    pub proof_days: u32,
}

#[event]
pub struct ChallengeSettlementStarted {
    pub challenge_id: Pubkey,
    pub required_days: u32,
}

#[event]
pub struct ParticipantSettled {
    pub challenge_id: Pubkey,
    pub user: Pubkey,
    pub is_winner: bool,
    pub proof_days: u32,
    pub required_days: u32,
}

#[event]
pub struct ChallengeSettled {
    pub challenge_id: Pubkey,
    pub winner_count: u32,
    pub loser_count: u32,
    pub bonus_per_winner: u64,
}

#[event]
pub struct PayoutClaimed {
    pub challenge_id: Pubkey,
    pub user: Pubkey,
    pub amount: u64,
}

#[event]
pub struct ChallengeCancelled {
    pub challenge_id: Pubkey,
    pub admin: Pubkey,
}

#[event]
pub struct RefundClaimed {
    pub challenge_id: Pubkey,
    pub user: Pubkey,
    pub amount: u64,
}

#[event]
pub struct FeeWithdrawn {
    pub challenge_id: Pubkey,
    pub admin: Pubkey,
    pub amount: u64,
}

#[event]
pub struct ParticipantClosed {
    pub challenge_id: Pubkey,
    pub user: Pubkey,
    pub closed_by: Pubkey,
}

#[event]
pub struct ChallengeClosed {
    pub challenge_id: Pubkey,
    pub admin: Pubkey,
}

#[error_code]
pub enum LockinError {
    #[msg("Invalid amount")]
    InvalidAmount,
    #[msg("Invalid duration")]
    InvalidDuration,
    #[msg("Invalid threshold")]
    InvalidThreshold,
    #[msg("Invalid fee")]
    InvalidFee,
    #[msg("Invalid start time")]
    InvalidStartTime,
    #[msg("Challenge ID cannot be empty")]
    ChallengeIdEmpty,
    #[msg("Challenge ID too long")]
    ChallengeIdTooLong,
    #[msg("Challenge ID mismatch")]
    ChallengeIdMismatch,
    #[msg("Invalid challenge status")]
    InvalidChallengeStatus,
    #[msg("Challenge already started")]
    ChallengeStarted,
    #[msg("Challenge not started yet")]
    ChallengeNotStarted,
    #[msg("Challenge has ended")]
    ChallengeEnded,
    #[msg("User not joined")]
    NotJoined,
    #[msg("Invalid oracle")]
    InvalidOracle,
    #[msg("Challenge not ended yet")]
    ChallengeNotEnded,
    #[msg("Participant already settled")]
    AlreadySettled,
    #[msg("Settlement incomplete")]
    SettlementIncomplete,
    #[msg("Challenge not settled")]
    ChallengeNotSettled,
    #[msg("User is not a winner")]
    NotWinner,
    #[msg("Payout already claimed")]
    PayoutAlreadyClaimed,
    #[msg("Unauthorized action")]
    Unauthorized,
    #[msg("Challenge is not cancelled")]
    NotCancelled,
    #[msg("Already claimed refund")]
    AlreadyClaimed,
    #[msg("No fees to withdraw")]
    NoFees,
    #[msg("Participant not settled yet")]
    NotSettled,
    #[msg("Math overflow")]
    MathOverflow,
    #[msg("Challenge still active")]
    ChallengeStillActive,
    #[msg("Winner payouts still pending")]
    PendingWinnerPayouts,
    #[msg("All winner payouts already claimed")]
    AllPayoutsClaimed,
    #[msg("Remainder distribution pending")]
    PendingRemainderDistribution,
    #[msg("Active participants remain")]
    ParticipantsRemaining,
    #[msg("Winner payout not claimed")]
    PayoutNotClaimed,
    #[msg("Refund not claimed")]
    RefundNotClaimed,
    #[msg("Platform fees still held in escrow")]
    FeesUncollected,
}
