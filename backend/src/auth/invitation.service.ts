import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { InviteUserDto } from './dto/invite-user.dto';
import { randomBytes, createHash } from 'node:crypto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class InvitationService {
  constructor(private readonly prisma: PrismaService) {}
  private hash(token: string) { return createHash('sha256').update(token).digest('hex'); }

  async invite(input: InviteUserDto, companyId: number, issuedById: number) {
    const email = input.email.trim().toLowerCase();
    if (await this.prisma.user.findUnique({where:{email}})) throw new ConflictException('Email already registered');
    const token = randomBytes(32).toString('hex');
    await this.prisma.userInvitation.create({data:{
      email,firstName:input.firstName.trim(),lastName:input.lastName.trim(),
      role:input.role,companyId,issuedById,tokenHash:this.hash(token),
      expiresAt:new Date(Date.now()+24*60*60*1000)
    }});
    // No email is sent here. Only return the link to the authenticated admin over HTTPS.
    const frontendUrl = process.env.FRONTEND_URL ?? process.env.CORS_ORIGIN;
    if (!frontendUrl || !/^https:\/\//.test(frontendUrl)) throw new BadRequestException('Secure frontend URL is not configured');
    return { email, expiresInHours:24, inviteUrl:frontendUrl.replace(/\/$/,'')+'/?invite='+encodeURIComponent(token) };
  }

  async accept(token: string, password: string) {
    if (!/^[0-9a-f]{64}$/.test(token)) throw new BadRequestException('Invalid invitation');
    const tokenHash = this.hash(token);
    const invitation = await this.prisma.userInvitation.findUnique({where:{tokenHash}});
    if (!invitation || invitation.acceptedAt || invitation.expiresAt <= new Date()) throw new BadRequestException('Invitation expired or invalid');
    const hashedPassword = await bcrypt.hash(password,12);
    try {
      await this.prisma.$transaction(async tx=>{
        const updated=await tx.userInvitation.updateMany({where:{id:invitation.id,acceptedAt:null,expiresAt:{gt:new Date()}},data:{acceptedAt:new Date()}});
        if (updated.count!==1) throw new BadRequestException('Invitation already used');
        await tx.user.create({data:{email:invitation.email,password:hashedPassword,firstName:invitation.firstName,lastName:invitation.lastName,role:invitation.role,companyId:invitation.companyId}});
      });
    } catch(error) {
      if (error instanceof BadRequestException) throw error;
      throw new ConflictException('Invitation cannot be accepted; account may already exist');
    }
    return {ok:true};
  }
}
